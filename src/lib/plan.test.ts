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
      locations: 1,
    });
  });

  it("sets branch limits by plan tier", () => {
    expect(PRO_ENTITLEMENTS.limits.locations).toBe(3);
    expect(MAX_ENTITLEMENTS.limits.locations).toBeNull();
  });

  it("allows payments on all plans and pro-only ops for pro and max", () => {
    expect(canUseFeature("free", "payments")).toBe(true);
    expect(canUseFeature("free", "reports")).toBe(false);
    expect(canUseFeature("free", "whatsappSms")).toBe(false);
    expect(canUseFeature("pro", "payments")).toBe(true);
    expect(canUseFeature("pro", "reports")).toBe(true);
    expect(canUseFeature("max", "payments")).toBe(true);
    expect(canUseFeature("max", "reports")).toBe(true);
  });

  it("allows AI growth features on Max but not Free or Pro", () => {
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

  it("reserves AI voice receptionist for max", () => {
    expect(minimumPlanForFeature("aiVoiceReceptionist")).toBe("max");
    expect(canUseFeature("free", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("pro", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("max", "aiVoiceReceptionist")).toBe(true);
    expect(FREE_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(PRO_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(MAX_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(true);
  });

  it("keeps public booking page available on all plans", () => {
    expect(canUseFeature("free", "publicBookingPage")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPage")).toBe(true);
    expect(canUseFeature("max", "publicBookingPage")).toBe(true);
  });

  it("reserves booking page customization for pro and max", () => {
    expect(canUseFeature("free", "publicBookingPageCustomization")).toBe(false);
    expect(canUseFeature("pro", "publicBookingPageCustomization")).toBe(true);
    expect(canUseFeature("max", "publicBookingPageCustomization")).toBe(true);
  });

  it("reserves AI review replies for Max", () => {
    expect(minimumPlanForFeature("reviewReplies")).toBe("max");
    expect(canUseFeature("free", "reviewReplies")).toBe(false);
    expect(canUseFeature("pro", "reviewReplies")).toBe(false);
    expect(canUseFeature("max", "reviewReplies")).toBe(true);
  });

  it("reserves broadcasts for pro and max", () => {
    expect(minimumPlanForFeature("broadcasts")).toBe("pro");
    expect(canUseFeature("free", "broadcasts")).toBe(false);
    expect(canUseFeature("pro", "broadcasts")).toBe(true);
    expect(canUseFeature("max", "broadcasts")).toBe(true);
  });

  it("reserves deals for pro and max", () => {
    expect(minimumPlanForFeature("deals")).toBe("pro");
    expect(canUseFeature("free", "deals")).toBe(false);
    expect(canUseFeature("pro", "deals")).toBe(true);
    expect(canUseFeature("max", "deals")).toBe(true);
  });

  it("reserves smart deal suggestions for max", () => {
    expect(minimumPlanForFeature("aiDealSuggestions")).toBe("max");
    expect(canUseFeature("free", "aiDealSuggestions")).toBe(false);
    expect(canUseFeature("pro", "aiDealSuggestions")).toBe(false);
    expect(canUseFeature("max", "aiDealSuggestions")).toBe(true);
  });
});

describe("subscription pricing", () => {
  it("returns monthly and annual prices from config", async () => {
    const { getSubscriptionPrice, DEFAULT_PLAN_CONFIG } = await import("./plan");
    expect(getSubscriptionPrice("pro", "monthly", DEFAULT_PLAN_CONFIG)).toBe(1490);
    expect(getSubscriptionPrice("pro", "annual", DEFAULT_PLAN_CONFIG)).toBe(14300);
    expect(getSubscriptionPrice("max", "monthly", DEFAULT_PLAN_CONFIG)).toBe(2490);
    expect(getSubscriptionPrice("max", "annual", DEFAULT_PLAN_CONFIG)).toBe(23900);
  });

  it("calculates annual savings percent", async () => {
    const { annualSavingsPercent } = await import("./plan");
    expect(annualSavingsPercent(1490, 14300)).toBe(20);
    expect(annualSavingsPercent(2490, 23900)).toBe(20);
  });
});

describe("resolveEffectivePlan", () => {
  it("downgrades expired paid plans to free", async () => {
    const { resolveEffectivePlan } = await import("./plan");
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(
      resolveEffectivePlan({
        storedPlan: "pro",
        planExpiresAt: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }),
    ).toBe("free");
    expect(
      resolveEffectivePlan({
        storedPlan: "max",
        planExpiresAt: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }),
    ).toBe("max");
  });
});
