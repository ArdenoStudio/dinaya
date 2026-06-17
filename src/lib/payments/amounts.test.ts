import { describe, expect, it } from "vitest";
import { convertLkrToUsd } from "@/lib/payments/amounts";

describe("payment amounts", () => {
  it("converts LKR to USD with a minimum charge", () => {
    expect(convertLkrToUsd(300)).toBe(1);
    expect(convertLkrToUsd(6000)).toBeGreaterThan(1);
  });
});
