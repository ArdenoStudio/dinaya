import { db } from "@/db";
import { bookings, deals, payments, services } from "@/db/schema";
import { and, count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { startOfMonth } from "date-fns";

export type DealAnalyticsSummary = {
  dealsPostedThisMonth: number;
  totalRedemptions: number;
  dealAttributedRevenueLkr: number;
  dealBookingsCount: number;
  conversionRatePercent: number | null;
  bestDeal: {
    id: string;
    serviceName: string;
    discountPercent: number;
    redemptions: number;
  } | null;
  redemptionsByDiscount: { discountPercent: number; redemptions: number }[];
};

export async function getDealAnalytics(businessId: string): Promise<DealAnalyticsSummary> {
  const monthStart = startOfMonth(new Date());

  const [
    [{ dealsPostedThisMonth }],
    [{ totalRedemptions }],
    [{ dealAttributedRevenueLkr }],
    [{ dealBookingsCount }],
    [{ totalImpressions }],
    bestDealRows,
    redemptionsByDiscount,
  ] = await Promise.all([
    db
      .select({ dealsPostedThisMonth: count() })
      .from(deals)
      .where(and(eq(deals.businessId, businessId), gte(deals.createdAt, monthStart))),
    db
      .select({ totalRedemptions: sql<number>`coalesce(sum(${deals.slotsRedeemed}), 0)::int` })
      .from(deals)
      .where(eq(deals.businessId, businessId)),
    db
      .select({
        dealAttributedRevenueLkr: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(
        eq(bookings.businessId, businessId),
        isNotNull(bookings.dealId),
        eq(payments.status, "success"),
      )),
    db
      .select({ dealBookingsCount: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), isNotNull(bookings.dealId))),
    db
      .select({ totalImpressions: sql<number>`coalesce(sum(${deals.impressionCount}), 0)::int` })
      .from(deals)
      .where(eq(deals.businessId, businessId)),
    db
      .select({
        id: deals.id,
        serviceName: services.name,
        discountPercent: deals.discountPercent,
        redemptions: deals.slotsRedeemed,
      })
      .from(deals)
      .innerJoin(services, eq(services.id, deals.serviceId))
      .where(eq(deals.businessId, businessId))
      .orderBy(desc(deals.slotsRedeemed))
      .limit(1),
    db
      .select({
        discountPercent: deals.discountPercent,
        redemptions: sql<number>`coalesce(sum(${deals.slotsRedeemed}), 0)::int`,
      })
      .from(deals)
      .where(eq(deals.businessId, businessId))
      .groupBy(deals.discountPercent)
      .orderBy(deals.discountPercent),
  ]);

  const impressions = Number(totalImpressions);
  const redemptions = Number(totalRedemptions);

  return {
    dealsPostedThisMonth: Number(dealsPostedThisMonth),
    totalRedemptions: redemptions,
    dealAttributedRevenueLkr: Number(dealAttributedRevenueLkr),
    dealBookingsCount: Number(dealBookingsCount),
    conversionRatePercent: impressions > 0 ? Math.round((redemptions / impressions) * 100) : null,
    bestDeal: bestDealRows[0] ?? null,
    redemptionsByDiscount: redemptionsByDiscount.map((row) => ({
      discountPercent: row.discountPercent,
      redemptions: Number(row.redemptions),
    })),
  };
}
