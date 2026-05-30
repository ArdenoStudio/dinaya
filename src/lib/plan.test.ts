import { describe, expect, it } from "vitest";
import {
  AI_FEATURES,
  EXPIRED_ENTITLEMENTS,
  MAX_ENTITLEMENTS,
  PRO_ENTITLEMENTS,
  TRIAL_ENTITLEMENTS,
  canUseFeature,
  minimumPlanForFeature,
} from "./plan";

describe("plan entitlements", () => {
  it("gives the trial Max-level access with a single location", () => {
    expect(TRIAL_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: null,
      staff: null,
      services: null,
      locations: 1,
    });
  });

  it("caps the cost-exposed AI Voice Receptionist behind a paid plan", () => {
    expect(TRIAL_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(canUseFeature("trial", "aiVoiceReceptionist")).toBe(false);
  });

  it("locks every feature once the plan expires", () => {
    expect(EXPIRED_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: 0,
      staff: 0,
      services: 0,
      locations: 0,
    });
    for (const feature of Object.keys(EXPIRED_ENTITLEMENTS.features) as (keyof typeof EXPIRED_ENTITLEMENTS.features)[]) {
      expect(EXPIRED_ENTITLEMENTS.features[feature]).toBe(false);
    }
  });

  it("sets branch limits by plan tier", () => {
    expect(PRO_ENTITLEMENTS.limits.locations).toBe(3);
    expect(MAX_ENTITLEMENTS.limits.locations).toBeNull();
  });

  it("allows payments and reports on trial and paid plans but not when expired", () => {
    expect(canUseFeature("trial", "payments")).toBe(true);
    expect(canUseFeature("trial", "reports")).toBe(true);
    expect(canUseFeature("pro", "payments")).toBe(true);
    expect(canUseFeature("pro", "reports")).toBe(true);
    expect(canUseFeature("max", "payments")).toBe(true);
    expect(canUseFeature("max", "reports")).toBe(true);
    expect(canUseFeature("expired", "payments")).toBe(false);
    expect(canUseFeature("expired", "reports")).toBe(false);
  });

  it("allows AI growth features on Trial and Max but not Pro or Expired", () => {
    for (const feature of AI_FEATURES) {
      expect(minimumPlanForFeature(feature)).toBe("max");
      expect(canUseFeature("trial", feature)).toBe(true);
      expect(canUseFeature("pro", feature)).toBe(false);
      expect(canUseFeature("max", feature)).toBe(true);
      expect(canUseFeature("expired", feature)).toBe(false);
      expect(TRIAL_ENTITLEMENTS.features[feature]).toBe(true);
      expect(PRO_ENTITLEMENTS.features[feature]).toBe(false);
      expect(MAX_ENTITLEMENTS.features[feature]).toBe(true);
    }
  });

  it("reserves AI voice receptionist for max", () => {
    expect(minimumPlanForFeature("aiVoiceReceptionist")).toBe("max");
    expect(canUseFeature("trial", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("pro", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("max", "aiVoiceReceptionist")).toBe(true);
    expect(TRIAL_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(PRO_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(MAX_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(true);
  });

  it("keeps the public booking page on trial and paid plans, off when expired", () => {
    expect(canUseFeature("trial", "publicBookingPage")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPage")).toBe(true);
    expect(canUseFeature("max", "publicBookingPage")).toBe(true);
    expect(canUseFeature("expired", "publicBookingPage")).toBe(false);
  });

  it("offers booking page customization on trial, pro and max", () => {
    expect(canUseFeature("trial", "publicBookingPageCustomization")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPageCustomization")).toBe(true);
    expect(canUseFeature("max", "publicBookingPageCustomization")).toBe(true);
  });

  it("reserves AI review replies for Max (and trial preview)", () => {
    expect(minimumPlanForFeature("reviewReplies")).toBe("max");
    expect(canUseFeature("trial", "reviewReplies")).toBe(true);
    expect(canUseFeature("pro", "reviewReplies")).toBe(false);
    expect(canUseFeature("max", "reviewReplies")).toBe(true);
  });

  it("reserves broadcasts for pro and max (and trial preview)", () => {
    expect(minimumPlanForFeature("broadcasts")).toBe("pro");
    expect(canUseFeature("trial", "broadcasts")).toBe(true);
    expect(canUseFeature("pro", "broadcasts")).toBe(true);
    expect(canUseFeature("max", "broadcasts")).toBe(true);
  });

  it("reserves deals for pro and max (and trial preview)", () => {
    expect(minimumPlanForFeature("deals")).toBe("pro");
    expect(canUseFeature("trial", "deals")).toBe(true);
    expect(canUseFeature("pro", "deals")).toBe(true);
    expect(canUseFeature("max", "deals")).toBe(true);
  });

  it("reserves smart deal suggestions for max (and trial preview)", () => {
    expect(minimumPlanForFeature("aiDealSuggestions")).toBe("max");
    expect(canUseFeature("trial", "aiDealSuggestions")).toBe(true);
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
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("locks expired paid plans to the expired state", async () => {
    const { resolveEffectivePlan } = await import("./plan");
    expect(
      resolveEffectivePlan({
        storedPlan: "pro",
        planExpiresAt: new Date("2026-05-01T00:00:00.000Z"),
        now,
      }),
    ).toBe("expired");
    expect(
      resolveEffectivePlan({
        storedPlan: "max",
        planExpiresAt: new Date("2026-07-01T00:00:00.000Z"),
        now,
      }),
    ).toBe("max");
  });

  it("keeps an in-window trial but locks a lapsed one", async () => {
    const { resolveEffectivePlan } = await import("./plan");
    expect(
      resolveEffectivePlan({
        storedPlan: "trial",
        planExpiresAt: new Date("2026-06-10T00:00:00.000Z"),
        now,
      }),
    ).toBe("trial");
    expect(
      resolveEffectivePlan({
        storedPlan: "trial",
        planExpiresAt: new Date("2026-05-20T00:00:00.000Z"),
        now,
      }),
    ).toBe("expired");
  });

  it("collapses legacy free rows and explicit expired to the locked state", async () => {
    const { resolveEffectivePlan } = await import("./plan");
    expect(resolveEffectivePlan({ storedPlan: "free", planExpiresAt: null, now })).toBe("expired");
    expect(resolveEffectivePlan({ storedPlan: "expired", planExpiresAt: null, now })).toBe("expired");
    expect(resolveEffectivePlan({ storedPlan: null, planExpiresAt: null, now })).toBe("expired");
  });
});
