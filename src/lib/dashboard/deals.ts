import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, deals, locations, payments, services, staff } from "@/db/schema";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { listBusinessDeals } from "@/lib/deals/queries";
import { getDealDisplayStatus, slotsRemaining } from "@/lib/deals/validation";

export type DashboardDealDetail = Awaited<ReturnType<typeof getDealDashboardDetail>>;
export type DashboardDealsList = Awaited<ReturnType<typeof getDealsDashboardList>>;
export type DashboardDealStatusFilter = "active" | "all" | "cancelled" | "expired" | "sold_out" | "upcoming";

export const dashboardDealStatusFilters = ["all", "active", "upcoming", "sold_out", "expired", "cancelled"] as const;

export type DashboardDealsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardDealStatusFilter;
};

const DEFAULT_DEAL_LIMIT = 80;
const MAX_DEAL_LIMIT = 150;

function normalizeDealLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_DEAL_LIMIT;
  return Math.min(MAX_DEAL_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_DEAL_LIMIT)));
}

export function isDashboardDealStatusFilter(value: string): value is DashboardDealStatusFilter {
  return dashboardDealStatusFilters.includes(value as DashboardDealStatusFilter);
}

export async function getDealsDashboardList(
  businessId: string,
  options: DashboardDealsListOptions = {},
) {
  const allDeals = await listBusinessDeals(businessId);
  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeDealLimit(options.limit);
  const mappedDeals = allDeals.map((deal) => {
    const displayStatus = getDealDisplayStatus(deal);
    const discountedPriceLkr = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);
    const conversionPercent = deal.impressionCount > 0
      ? Math.round((deal.slotsRedeemed / deal.impressionCount) * 100)
      : null;

    return {
      apptWindowEnd: deal.apptWindowEnd.toISOString(),
      apptWindowStart: deal.apptWindowStart.toISOString(),
      conversionPercent,
      createdAt: deal.createdAt.toISOString(),
      dealWindowEnd: deal.dealWindowEnd.toISOString(),
      dealWindowStart: deal.dealWindowStart.toISOString(),
      discountPercent: deal.discountPercent,
      discountedPriceLkr,
      displayStatus,
      id: deal.id,
      impressionCount: deal.impressionCount,
      locationId: deal.locationId,
      locationName: deal.locationName,
      serviceId: deal.serviceId,
      serviceName: deal.serviceName,
      servicePriceLkr: deal.servicePriceLkr,
      slotsRedeemed: deal.slotsRedeemed,
      slotsRemaining: slotsRemaining(deal),
      slotsTotal: deal.slotsTotal,
      staffId: deal.staffId,
      staffName: deal.staffName,
      status: deal.status,
    };
  });

  const filteredRows = mappedDeals.filter((deal) => {
    const statusMatch = status === "all" || deal.displayStatus === status;
    const queryMatch = !query || [
      deal.locationName,
      deal.serviceName,
      deal.staffName ?? "",
      deal.displayStatus,
    ].some((value) => value.toLowerCase().includes(query));
    return statusMatch && queryMatch;
  });

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: filteredRows.slice(0, limit),
    summary: {
      activeDeals: mappedDeals.filter((deal) => deal.displayStatus === "active").length,
      cancelledDeals: mappedDeals.filter((deal) => deal.displayStatus === "cancelled").length,
      expiredDeals: mappedDeals.filter((deal) => deal.displayStatus === "expired").length,
      impressions: mappedDeals.reduce((sum, deal) => sum + deal.impressionCount, 0),
      redeemedSlots: mappedDeals.reduce((sum, deal) => sum + deal.slotsRedeemed, 0),
      soldOutDeals: mappedDeals.filter((deal) => deal.displayStatus === "sold_out").length,
      totalDeals: mappedDeals.length,
      upcomingDeals: mappedDeals.filter((deal) => deal.displayStatus === "upcoming").length,
    },
  };
}

export async function getDealDashboardDetail(businessId: string, dealId: string) {
  const [row] = await db
    .select({
      apptWindowEnd: deals.apptWindowEnd,
      apptWindowStart: deals.apptWindowStart,
      createdAt: deals.createdAt,
      dealWindowEnd: deals.dealWindowEnd,
      dealWindowStart: deals.dealWindowStart,
      discountPercent: deals.discountPercent,
      id: deals.id,
      impressionCount: deals.impressionCount,
      locationId: locations.id,
      locationName: locations.name,
      locationTimezone: locations.timezone,
      serviceDepositPercent: services.depositPercent,
      serviceDurationMinutes: services.durationMinutes,
      serviceId: services.id,
      serviceName: services.name,
      servicePriceLkr: services.priceLkr,
      serviceRequiresPayment: services.requiresPayment,
      slotsRedeemed: deals.slotsRedeemed,
      slotsTotal: deals.slotsTotal,
      staffId: staff.id,
      staffName: staff.name,
      status: deals.status,
    })
    .from(deals)
    .innerJoin(services, eq(deals.serviceId, services.id))
    .innerJoin(locations, eq(deals.locationId, locations.id))
    .leftJoin(staff, eq(deals.staffId, staff.id))
    .where(and(eq(deals.id, dealId), eq(deals.businessId, businessId)))
    .limit(1);

  if (!row) return null;

  const recentBookings = await db
    .select({
      amountLkr: payments.amountLkr,
      clientName: bookings.clientName,
      discountedPriceLkr: bookings.discountedPriceLkr,
      id: bookings.id,
      paymentStatus: payments.status,
      startsAt: bookings.startsAt,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(payments, eq(bookings.id, payments.bookingId))
    .where(and(eq(bookings.dealId, dealId), eq(bookings.businessId, businessId)))
    .orderBy(desc(bookings.startsAt))
    .limit(30);

  const discountedPriceLkr = computeDiscountedPrice(row.servicePriceLkr, row.discountPercent);
  const conversionPercent = row.impressionCount > 0
    ? Math.round((row.slotsRedeemed / row.impressionCount) * 100)
    : null;

  return {
    deal: {
      apptWindowEnd: row.apptWindowEnd.toISOString(),
      apptWindowStart: row.apptWindowStart.toISOString(),
      conversionPercent,
      createdAt: row.createdAt.toISOString(),
      dealWindowEnd: row.dealWindowEnd.toISOString(),
      dealWindowStart: row.dealWindowStart.toISOString(),
      discountPercent: row.discountPercent,
      discountedPriceLkr,
      displayStatus: getDealDisplayStatus(row),
      id: row.id,
      impressionCount: row.impressionCount,
      slotsRedeemed: row.slotsRedeemed,
      slotsRemaining: slotsRemaining(row),
      slotsTotal: row.slotsTotal,
      status: row.status,
    },
    location: {
      id: row.locationId,
      name: row.locationName,
      timezone: row.locationTimezone,
    },
    service: {
      depositPercent: row.serviceDepositPercent,
      durationMinutes: row.serviceDurationMinutes,
      id: row.serviceId,
      name: row.serviceName,
      priceLkr: row.servicePriceLkr,
      requiresPayment: row.serviceRequiresPayment,
    },
    staff: row.staffId
      ? {
          id: row.staffId,
          name: row.staffName,
        }
      : null,
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: booking.startsAt.toISOString(),
    })),
  };
}
