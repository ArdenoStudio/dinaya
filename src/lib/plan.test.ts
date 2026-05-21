import { describe, expect, it } from "vitest";
import {
  AI_FEATURES,
  FREE_ENTITLEMENTS,
  MAX_ENTITLEMENTS,
  PRO_ENTITLEMENTS,
  canUseFeature,
  minimumPlanForFeature,
} from "./plan";

describe("plan entitlements", () => {
  it("keeps free plan limits intentionally constrained", () => {
    expect(FREE_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: null,
      staff: 1,
      services: 5,
    });
  });

  it("allows pro-only operational surfaces for pro and max", () => {
    expect(canUseFeature("free", "payments")).toBe(false);
    expect(canUseFeature("free", "reports")).toBe(false);
    expect(canUseFeature("pro", "payments")).toBe(true);
    expect(canUseFeature("pro", "reports")).toBe(true);
    expect(canUseFeature("max", "payments")).toBe(true);
    expect(canUseFeature("max", "reports")).toBe(true);
  });

  it("keeps AI growth features max-only", () => {
    for (const feature of AI_FEATURES) {
      expect(minimumPlanForFeature(feature)).toBe("max");
      expect(canUseFeature("free", feature)).toBe(false);
      expect(canUseFeature("pro", feature)).toBe(false);
      expect(canUseFeature("max", feature)).toBe(true);
      expect(FREE_ENTITLEMENTS.features[feature]).toBe(false);
      expect(PRO_ENTITLEMENTS.features[feature]).toBe(false);
      expect(MAX_ENTITLEMENTS.features[feature]).toBe(true);
    }
  });

  it("keeps public booking page available on all plans", () => {
    expect(canUseFeature("free", "publicBookingPage")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPage")).toBe(true);
    expect(canUseFeature("max", "publicBookingPage")).toBe(true);
  });
});
