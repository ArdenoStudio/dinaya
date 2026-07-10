import { describe, expect, it } from "vitest";
import { acquisitionRate } from "@/lib/admin-acquisition";

describe("acquisitionRate", () => {
  it("returns 0 for empty cohort", () => {
    expect(acquisitionRate(0, 0)).toBe(0);
  });

  it("rounds to one decimal", () => {
    expect(acquisitionRate(1, 3)).toBe(33.3);
  });
});
