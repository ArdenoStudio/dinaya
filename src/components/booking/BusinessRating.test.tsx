import { describe, expect, it } from "vitest";
import {
  getBusinessRating,
  HIGH_RATING_THRESHOLD,
  shouldShowReviewCount,
} from "./BusinessRating";
import { getBookingCopy } from "@/lib/i18n";

const copy = getBookingCopy("en");

describe("shouldShowReviewCount", () => {
  it("shows count below the high-rating threshold", () => {
    expect(shouldShowReviewCount(HIGH_RATING_THRESHOLD - 0.1)).toBe(true);
  });

  it("hides count at or above the high-rating threshold", () => {
    expect(shouldShowReviewCount(HIGH_RATING_THRESHOLD)).toBe(false);
    expect(shouldShowReviewCount(4.9)).toBe(false);
  });

  it("respects an explicit showCount override", () => {
    expect(shouldShowReviewCount(4.9, true)).toBe(true);
    expect(shouldShowReviewCount(4.2, false)).toBe(false);
  });
});

describe("getBusinessRating", () => {
  it("returns null when review data is missing", () => {
    expect(getBusinessRating(null, 10)).toBeNull();
    expect(getBusinessRating(4.5, 0)).toBeNull();
  });

  it("returns normalized rating data", () => {
    expect(getBusinessRating(4.7, 1500)).toEqual({ avgRating: 4.7, reviewCount: 1500 });
  });
});

describe("booking review copy", () => {
  it("uses shorter review count labels", () => {
    expect(copy.reviewsCount.replace("{count}", "1,500")).toBe("1,500 reviews");
    expect(copy.reviewCountSingular).toBe("1 review");
  });
});
