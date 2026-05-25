import { describe, expect, it } from "vitest";
import {
  computeAmountDueFromDiscountedPrice,
  computeAmountDueLkr,
  computeDiscountedPrice,
} from "./pricing";

describe("deal pricing", () => {
  it("computes discounted price with floor rounding", () => {
    expect(computeDiscountedPrice(1000, 30)).toBe(700);
    expect(computeDiscountedPrice(999, 30)).toBe(699);
  });

  it("applies deposit percent on discounted price", () => {
    expect(computeAmountDueLkr(1000, 30, 50)).toBe(350);
    expect(computeAmountDueFromDiscountedPrice(700, 50)).toBe(350);
  });

  it("returns full discounted price when no deposit", () => {
    expect(computeAmountDueLkr(2000, 25, 0)).toBe(1500);
  });
});
