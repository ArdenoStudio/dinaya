import { describe, expect, it } from "vitest";
import {
  adjustDiscountFromHistory,
  computeBucketFillRates,
  discountToBucket,
  formatDiscountLearningMessage,
} from "./conversion";

describe("deal conversion helpers", () => {
  it("maps discount tiers to buckets", () => {
    expect(discountToBucket(15)).toBe("10-20");
    expect(discountToBucket(25)).toBe("25");
    expect(discountToBucket(40)).toBe("40+");
  });

  it("computes fill rates by bucket", () => {
    const rates = computeBucketFillRates([
      { discountPercent: 20, slotsTotal: 4, slotsRedeemed: 2 },
      { discountPercent: 25, slotsTotal: 4, slotsRedeemed: 3 },
    ]);

    expect(rates.get("10-20")?.fillRate).toBe(0.5);
    expect(rates.get("25")?.fillRate).toBe(0.75);
  });

  it("bumps discount when historical fill rate is low", () => {
    const result = adjustDiscountFromHistory(25, {
      redeemed: 1,
      total: 4,
      fillRate: 0.25,
    });

    expect(result.adjustedDiscount).toBe(30);
    expect(formatDiscountLearningMessage(result.meta)).toContain("suggesting 30%");
  });

  it("lowers discount when historical fill rate is high", () => {
    const result = adjustDiscountFromHistory(30, {
      redeemed: 4,
      total: 4,
      fillRate: 1,
    });

    expect(result.adjustedDiscount).toBe(25);
  });

  it("stores demand-adjusted discount before historical learning", () => {
    const demand = {
      shouldSuggest: true,
      demandLabel: "quiet" as const,
      quietScore: 90,
      confidence: "high" as const,
      currentUtilizationRate: 0.1,
      currentBookingCount: 0,
      availableSlotCount: 12,
      historicalBookingCount: 5,
      historicalSameWindowBookedDays: 0,
      historicalSameWindowSampleDays: 12,
      historicalSameWindowFillRate: 0,
      reason: "quiet",
      sources: [],
    };

    const result = adjustDiscountFromHistory(30, null, demand);

    expect(result.adjustedDiscount).toBe(40);
    expect(result.meta.demandAdjustedDiscount).toBe(40);
  });
});
