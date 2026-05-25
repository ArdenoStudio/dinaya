import { describe, expect, it } from "vitest";
import { findLongestGap, suggestDiscountPercent, suggestSlotCount } from "./suggestions";

describe("deal suggestions", () => {
  it("suggests higher discounts for longer gaps", () => {
    expect(suggestDiscountPercent(50)).toBe(20);
    expect(suggestDiscountPercent(120)).toBe(30);
    expect(suggestDiscountPercent(200)).toBe(40);
  });

  it("caps suggested slot count", () => {
    expect(suggestSlotCount(45, 30)).toBe(1);
    expect(suggestSlotCount(180, 30)).toBe(5);
  });

  it("finds the longest contiguous availability run", () => {
    const start = new Date("2026-05-25T08:00:00Z");
    const gap = findLongestGap([
      { startUtc: start, endUtc: new Date("2026-05-25T09:30:00Z") },
      { startUtc: new Date("2026-05-25T09:45:00Z"), endUtc: new Date("2026-05-25T10:00:00Z") },
      { startUtc: new Date("2026-05-25T12:00:00Z"), endUtc: new Date("2026-05-25T15:00:00Z") },
    ]);

    expect(gap?.gapMinutes).toBe(180);
  });
});
