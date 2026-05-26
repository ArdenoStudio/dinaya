import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { deals } from "@/db/schema";
import { adjustDiscountForDemand, type DemandAssessment } from "@/lib/deals/demand";
import { suggestDiscountPercent } from "@/lib/deals/suggestions";

export type DiscountBucket = "10-20" | "25" | "30" | "35" | "40+";

export type BucketFillStats = {
  redeemed: number;
  total: number;
  fillRate: number;
};

export type DiscountRecommendationMeta = {
  baselineDiscount: number;
  demandAdjustedDiscount: number;
  adjustedDiscount: number;
  historicalFillRate: number | null;
  bucket: DiscountBucket | null;
  redeemed: number | null;
  total: number | null;
  demand?: DemandAssessment;
};

export function discountToBucket(discountPercent: number): DiscountBucket {
  if (discountPercent <= 20) return "10-20";
  if (discountPercent <= 25) return "25";
  if (discountPercent <= 30) return "30";
  if (discountPercent <= 35) return "35";
  return "40+";
}

export function computeBucketFillRates(
  rows: Array<{ discountPercent: number; slotsTotal: number; slotsRedeemed: number }>,
): Map<DiscountBucket, BucketFillStats> {
  const totals = new Map<DiscountBucket, { redeemed: number; total: number }>();

  for (const row of rows) {
    const bucket = discountToBucket(row.discountPercent);
    const current = totals.get(bucket) ?? { redeemed: 0, total: 0 };
    current.redeemed += row.slotsRedeemed;
    current.total += row.slotsTotal;
    totals.set(bucket, current);
  }

  return new Map(
    [...totals.entries()].map(([bucket, stats]) => [
      bucket,
      {
        redeemed: stats.redeemed,
        total: stats.total,
        fillRate: stats.total > 0 ? stats.redeemed / stats.total : 0,
      },
    ]),
  );
}

export function adjustDiscountFromHistory(
  baselineDiscount: number,
  bucketStats: BucketFillStats | null,
  demand?: DemandAssessment,
): { adjustedDiscount: number; meta: DiscountRecommendationMeta } {
  const demandAdjustedDiscount = demand
    ? adjustDiscountForDemand(baselineDiscount, demand)
    : baselineDiscount;
  const bucket = discountToBucket(demandAdjustedDiscount);
  const historicalFillRate = bucketStats?.total ? bucketStats.fillRate : null;

  if (historicalFillRate === null || bucketStats?.total === 0) {
    return {
      adjustedDiscount: demandAdjustedDiscount,
      meta: {
        baselineDiscount,
        demandAdjustedDiscount,
        adjustedDiscount: demandAdjustedDiscount,
        historicalFillRate: null,
        bucket,
        redeemed: null,
        total: null,
        demand,
      },
    };
  }

  let adjustedDiscount = demandAdjustedDiscount;
  if (historicalFillRate < 0.5) {
    adjustedDiscount = Math.min(50, demandAdjustedDiscount + 5);
  } else if (historicalFillRate > 0.8) {
    adjustedDiscount = Math.max(10, demandAdjustedDiscount - 5);
  }

  return {
    adjustedDiscount,
    meta: {
      baselineDiscount,
      demandAdjustedDiscount,
      adjustedDiscount,
      historicalFillRate,
      bucket,
      redeemed: bucketStats!.redeemed,
      total: bucketStats!.total,
      demand,
    },
  };
}

export function formatDiscountLearningMessage(meta: DiscountRecommendationMeta): string | null {
  if (meta.historicalFillRate === null || meta.redeemed === null || meta.total === null || meta.bucket === null) {
    return null;
  }

  if (meta.adjustedDiscount === meta.baselineDiscount) {
    return null;
  }

  const bucketLabel = meta.bucket === "40+" ? "40%+" : meta.bucket.replace("-", "–") + "%";
  return `Similar deals at ${bucketLabel} filled ${meta.redeemed}/${meta.total} slots — suggesting ${meta.adjustedDiscount}%.`;
}

async function loadHistoricalDeals(businessId: string, serviceId?: string) {
  const conditions = [
    eq(deals.businessId, businessId),
    inArray(deals.status, ["active", "sold_out", "expired", "cancelled"]),
  ];

  if (serviceId) {
    conditions.push(eq(deals.serviceId, serviceId));
  }

  return db
    .select({
      discountPercent: deals.discountPercent,
      slotsTotal: deals.slotsTotal,
      slotsRedeemed: deals.slotsRedeemed,
    })
    .from(deals)
    .where(and(...conditions));
}

export async function recommendDiscountPercent(input: {
  businessId: string;
  serviceId?: string;
  gapMinutes: number;
  demand?: DemandAssessment;
}): Promise<{ discountPercent: number; meta: DiscountRecommendationMeta }> {
  const baselineDiscount = suggestDiscountPercent(input.gapMinutes);
  const historical = await loadHistoricalDeals(input.businessId, input.serviceId);
  const bucketRates = computeBucketFillRates(historical);
  const demandAdjustedDiscount = input.demand
    ? adjustDiscountForDemand(baselineDiscount, input.demand)
    : baselineDiscount;
  const bucketStats = bucketRates.get(discountToBucket(demandAdjustedDiscount)) ?? null;
  const { adjustedDiscount, meta } = adjustDiscountFromHistory(
    baselineDiscount,
    bucketStats,
    input.demand,
  );

  return { discountPercent: adjustedDiscount, meta };
}
