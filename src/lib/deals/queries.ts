import { db } from "@/db";
import {
  businesses,
  deals,
  locations,
  services,
  staff,
} from "@/db/schema";
import { and, desc, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";
import type { DirectoryCategory } from "@/lib/directory";
import { slotsRemaining } from "@/lib/deals/validation";

export type DealListItem = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  logoUrl: string | null;
  directoryCity: string | null;
  directoryCategory: string | null;
  serviceId: string;
  serviceName: string;
  servicePriceLkr: number;
  staffId: string | null;
  staffName: string | null;
  locationId: string;
  discountPercent: number;
  slotsTotal: number;
  slotsRedeemed: number;
  slotsRemaining: number;
  dealWindowStart: Date;
  dealWindowEnd: Date;
  apptWindowStart: Date;
  apptWindowEnd: Date;
  status: typeof deals.$inferSelect.status;
  impressionCount: number;
};

const activeDealConditions = and(
  eq(deals.status, "active"),
  gt(deals.dealWindowEnd, sql`now()`),
  lt(deals.slotsRedeemed, deals.slotsTotal),
  eq(businesses.directoryListed, true),
  eq(businesses.isSuspended, false),
  sql`${businesses.deletedAt} IS NULL`,
);

function mapDealRow(row: {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  logoUrl: string | null;
  directoryCity: string | null;
  directoryCategory: string | null;
  serviceId: string;
  serviceName: string;
  servicePriceLkr: number;
  staffId: string | null;
  staffName: string | null;
  locationId: string;
  discountPercent: number;
  slotsTotal: number;
  slotsRedeemed: number;
  dealWindowStart: Date;
  dealWindowEnd: Date;
  apptWindowStart: Date;
  apptWindowEnd: Date;
  status: typeof deals.$inferSelect.status;
  impressionCount: number;
}): DealListItem {
  return {
    ...row,
    slotsRemaining: slotsRemaining(row),
  };
}

export async function listActiveDeals(filters?: {
  city?: string;
  category?: DirectoryCategory;
  minDiscount?: number;
  businessId?: string;
}): Promise<DealListItem[]> {
  const conditions = [activeDealConditions];

  if (filters?.city) {
    conditions.push(eq(businesses.directoryCity, filters.city));
  }
  if (filters?.category) {
    conditions.push(eq(businesses.directoryCategory, filters.category));
  }
  if (filters?.minDiscount) {
    conditions.push(gte(deals.discountPercent, filters.minDiscount));
  }
  if (filters?.businessId) {
    conditions.push(eq(deals.businessId, filters.businessId));
  }

  const rows = await db
    .select({
      id: deals.id,
      businessId: deals.businessId,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      logoUrl: businesses.logoUrl,
      directoryCity: businesses.directoryCity,
      directoryCategory: businesses.directoryCategory,
      serviceId: deals.serviceId,
      serviceName: services.name,
      servicePriceLkr: services.priceLkr,
      staffId: deals.staffId,
      staffName: staff.name,
      locationId: deals.locationId,
      discountPercent: deals.discountPercent,
      slotsTotal: deals.slotsTotal,
      slotsRedeemed: deals.slotsRedeemed,
      dealWindowStart: deals.dealWindowStart,
      dealWindowEnd: deals.dealWindowEnd,
      apptWindowStart: deals.apptWindowStart,
      apptWindowEnd: deals.apptWindowEnd,
      status: deals.status,
      impressionCount: deals.impressionCount,
    })
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .innerJoin(services, eq(deals.serviceId, services.id))
    .leftJoin(staff, eq(deals.staffId, staff.id))
    .where(and(...conditions))
    .orderBy(desc(deals.discountPercent), desc(deals.createdAt));

  return rows.map(mapDealRow);
}

export async function listBusinessDeals(businessId: string) {
  return db
    .select({
      id: deals.id,
      serviceId: deals.serviceId,
      serviceName: services.name,
      servicePriceLkr: services.priceLkr,
      staffId: deals.staffId,
      staffName: staff.name,
      locationId: deals.locationId,
      locationName: locations.name,
      discountPercent: deals.discountPercent,
      slotsTotal: deals.slotsTotal,
      slotsRedeemed: deals.slotsRedeemed,
      dealWindowStart: deals.dealWindowStart,
      dealWindowEnd: deals.dealWindowEnd,
      apptWindowStart: deals.apptWindowStart,
      apptWindowEnd: deals.apptWindowEnd,
      status: deals.status,
      impressionCount: deals.impressionCount,
      createdAt: deals.createdAt,
    })
    .from(deals)
    .innerJoin(services, eq(deals.serviceId, services.id))
    .leftJoin(staff, eq(deals.staffId, staff.id))
    .innerJoin(locations, eq(deals.locationId, locations.id))
    .where(eq(deals.businessId, businessId))
    .orderBy(desc(deals.createdAt));
}

export async function getDealById(dealId: string) {
  const [row] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, dealId))
    .limit(1);
  return row ?? null;
}

export async function getDealForBooking(dealId: string, businessId: string) {
  const [row] = await db
    .select()
    .from(deals)
    .where(and(eq(deals.id, dealId), eq(deals.businessId, businessId)))
    .limit(1);
  return row ?? null;
}

export async function expirePastDeals(): Promise<number> {
  const result = await db
    .update(deals)
    .set({ status: "expired" })
    .where(and(
      eq(deals.status, "active"),
      lt(deals.dealWindowEnd, sql`now()`),
    ))
    .returning({ id: deals.id });
  return result.length;
}

export async function listActiveDealsForBusiness(businessId: string): Promise<DealListItem[]> {
  const rows = await db
    .select({
      id: deals.id,
      businessId: deals.businessId,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      logoUrl: businesses.logoUrl,
      directoryCity: businesses.directoryCity,
      directoryCategory: businesses.directoryCategory,
      serviceId: deals.serviceId,
      serviceName: services.name,
      servicePriceLkr: services.priceLkr,
      staffId: deals.staffId,
      staffName: staff.name,
      locationId: deals.locationId,
      discountPercent: deals.discountPercent,
      slotsTotal: deals.slotsTotal,
      slotsRedeemed: deals.slotsRedeemed,
      dealWindowStart: deals.dealWindowStart,
      dealWindowEnd: deals.dealWindowEnd,
      apptWindowStart: deals.apptWindowStart,
      apptWindowEnd: deals.apptWindowEnd,
      status: deals.status,
      impressionCount: deals.impressionCount,
    })
    .from(deals)
    .innerJoin(businesses, eq(deals.businessId, businesses.id))
    .innerJoin(services, eq(deals.serviceId, services.id))
    .leftJoin(staff, eq(deals.staffId, staff.id))
    .where(and(
      eq(deals.businessId, businessId),
      eq(deals.status, "active"),
      gt(deals.dealWindowEnd, sql`now()`),
      lt(deals.slotsRedeemed, deals.slotsTotal),
    ))
    .orderBy(desc(deals.discountPercent), desc(deals.createdAt));

  return rows.map(mapDealRow);
}

export async function getDealsByIds(dealIds: string[]) {
  if (dealIds.length === 0) return [];
  return db
    .select()
    .from(deals)
    .where(inArray(deals.id, dealIds));
}
