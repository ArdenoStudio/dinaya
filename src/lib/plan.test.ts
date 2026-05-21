import { describe, expect, it } from "vitest";
import { FREE_ENTITLEMENTS, PRO_ENTITLEMENTS, canUseFeature } from "./plan";

const PRO_ONLY_AI_FEATURES = [
  "aiBookingAutopilot",
  "smartReminderSystem",
  "reviewEngine",
  "clientReactivationCampaign",
  "aiUpsellAssistant",
  "aiContentMachine",
  "vipLoyaltySequence",
] as const;

describe("plan entitlements", () => {
  it("keeps free plan limits intentionally constrained", () => {
    expect(FREE_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: null,
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

  it("keeps AI growth features pro-only", () => {
    for (const feature of PRO_ONLY_AI_FEATURES) {
      expect(canUseFeature("free", feature)).toBe(false);
      expect(canUseFeature("pro", feature)).toBe(true);
      expect(FREE_ENTITLEMENTS.features[feature]).toBe(false);
      expect(PRO_ENTITLEMENTS.features[feature]).toBe(true);
    }
  });
});
