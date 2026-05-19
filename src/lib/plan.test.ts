import { describe, expect, it } from "vitest";
import { FREE_ENTITLEMENTS, PRO_ENTITLEMENTS, canUseFeature } from "./plan";

describe("plan entitlements", () => {
  it("keeps free plan limits intentionally constrained", () => {
    expect(FREE_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: 50,
      staff: 1,
      services: 5,
    });
  });

  it("allows pro-only surfaces only for pro businesses", () => {
    expect(canUseFeature("free", "payments")).toBe(false);
    expect(canUseFeature("free", "reports")).toBe(false);
    expect(canUseFeature("pro", "payments")).toBe(true);
    expect(canUseFeature("pro", "reports")).toBe(true);
  });

  it("keeps public booking page available on both plans", () => {
    expect(canUseFeature("free", "publicBookingPage")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPage")).toBe(true);
    expect(PRO_ENTITLEMENTS.features.publicBookingPage).toBe(true);
  });
});
