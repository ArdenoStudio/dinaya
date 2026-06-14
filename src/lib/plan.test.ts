import { describe, expect, it } from "vitest";
import {
  AI_FEATURES,
  EXPIRED_ENTITLEMENTS,
  MAX_ENTITLEMENTS,
  PRO_ENTITLEMENTS,
  STARTER_ENTITLEMENTS,
  TRIAL_ENTITLEMENTS,
  canUseFeature,
  minimumPlanForFeature,
  type PlanConfig,
} from "./plan";

describe("plan entitlements", () => {
  it("gives the trial Pro-level access with a single location", () => {
    expect(TRIAL_ENTITLEMENTS.limits).toMatchObject({
      bookingsPerMonth: null,
      staff: 5,
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

  it("sets limits by plan tier", () => {
    expect(STARTER_ENTITLEMENTS.limits).toMatchObject({ staff: 2, services: 10, locations: 1 });
    expect(PRO_ENTITLEMENTS.limits).toMatchObject({ staff: 5, services: null, locations: 1 });
    expect(MAX_ENTITLEMENTS.limits).toMatchObject({ staff: 15, services: null, locations: 3 });
  });

  it("sets WhatsApp allowances that protect margin (Starter off, Pro 500, Growth 2000)", () => {
    expect(STARTER_ENTITLEMENTS.limits.whatsappMessagesPerMonth).toBe(0);
    expect(PRO_ENTITLEMENTS.limits.whatsappMessagesPerMonth).toBe(500);
    expect(MAX_ENTITLEMENTS.limits.whatsappMessagesPerMonth).toBe(2000);
    expect(TRIAL_ENTITLEMENTS.limits.whatsappMessagesPerMonth).toBe(200);
  });

  it("allows payments on Starter and reports on Pro or higher", () => {
    expect(canUseFeature("trial", "payments")).toBe(true);
    expect(canUseFeature("trial", "reports")).toBe(true);
    expect(canUseFeature("starter", "payments")).toBe(true);
    expect(canUseFeature("starter", "reports")).toBe(false);
    expect(canUseFeature("pro", "payments")).toBe(true);
    expect(canUseFeature("pro", "reports")).toBe(true);
    expect(canUseFeature("max", "payments")).toBe(true);
    expect(canUseFeature("max", "reports")).toBe(true);
    expect(canUseFeature("expired", "payments")).toBe(false);
    expect(canUseFeature("expired", "reports")).toBe(false);
  });

  it("allows AI growth features on Growth but not Trial, Starter, Pro, or Expired", () => {
    for (const feature of AI_FEATURES) {
      expect(minimumPlanForFeature(feature)).toBe("max");
      expect(canUseFeature("trial", feature)).toBe(false);
      expect(canUseFeature("starter", feature)).toBe(false);
      expect(canUseFeature("pro", feature)).toBe(false);
      expect(canUseFeature("max", feature)).toBe(true);
      expect(canUseFeature("expired", feature)).toBe(false);
      expect(TRIAL_ENTITLEMENTS.features[feature]).toBe(false);
      expect(STARTER_ENTITLEMENTS.features[feature]).toBe(false);
      expect(PRO_ENTITLEMENTS.features[feature]).toBe(false);
      expect(MAX_ENTITLEMENTS.features[feature]).toBe(true);
    }
  });

  it("keeps AI voice receptionist behind the future max rollout", () => {
    expect(minimumPlanForFeature("aiVoiceReceptionist")).toBe("max");
    expect(canUseFeature("trial", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("starter", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("pro", "aiVoiceReceptionist")).toBe(false);
    expect(canUseFeature("max", "aiVoiceReceptionist")).toBe(false);
    expect(TRIAL_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(PRO_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
    expect(MAX_ENTITLEMENTS.features.aiVoiceReceptionist).toBe(false);
  });

  it("keeps the public booking page on trial and paid plans, off when expired", () => {
    expect(canUseFeature("trial", "publicBookingPage")).toBe(true);
    expect(canUseFeature("starter", "publicBookingPage")).toBe(true);
    expect(canUseFeature("pro", "publicBookingPage")).toBe(true);
    expect(canUseFeature("max", "publicBookingPage")).toBe(true);
    expect(canUseFeature("expired", "publicBookingPage")).toBe(false);
  });

  it("reserves booking page customization for Growth", () => {
    expect(minimumPlanForFeature("publicBookingPageCustomization")).toBe("max");
    expect(canUseFeature("trial", "publicBookingPageCustomization")).toBe(false);
    expect(canUseFeature("starter", "publicBookingPageCustomization")).toBe(false);
    expect(canUseFeature("pro", "publicBookingPageCustomization")).toBe(false);
    expect(canUseFeature("max", "publicBookingPageCustomization")).toBe(true);
  });

  it("reserves AI review replies for Growth", () => {
    expect(minimumPlanForFeature("reviewReplies")).toBe("max");
    expect(canUseFeature("trial", "reviewReplies")).toBe(false);
    expect(canUseFeature("starter", "reviewReplies")).toBe(false);
    expect(canUseFeature("pro", "reviewReplies")).toBe(false);
    expect(canUseFeature("max", "reviewReplies")).toBe(true);
  });

  it("reserves broadcasts for pro and max (and trial preview)", () => {
    expect(minimumPlanForFeature("broadcasts")).toBe("pro");
    expect(canUseFeature("trial", "broadcasts")).toBe(true);
    expect(canUseFeature("starter", "broadcasts")).toBe(false);
    expect(canUseFeature("pro", "broadcasts")).toBe(true);
    expect(canUseFeature("max", "broadcasts")).toBe(true);
  });

  it("reserves deals for pro and max (and trial preview)", () => {
    expect(minimumPlanForFeature("deals")).toBe("pro");
    expect(canUseFeature("trial", "deals")).toBe(true);
    expect(canUseFeature("starter", "deals")).toBe(false);
    expect(canUseFeature("pro", "deals")).toBe(true);
    expect(canUseFeature("max", "deals")).toBe(true);
  });

  it("reserves smart deal suggestions for Growth", () => {
    expect(minimumPlanForFeature("aiDealSuggestions")).toBe("max");
    expect(canUseFeature("trial", "aiDealSuggestions")).toBe(false);
    expect(canUseFeature("starter", "aiDealSuggestions")).toBe(false);
    expect(canUseFeature("pro", "aiDealSuggestions")).toBe(false);
    expect(canUseFeature("max", "aiDealSuggestions")).toBe(true);
  });
});

describe("subscription pricing", () => {
  it("returns monthly and annual prices from config", async () => {
    const { getSubscriptionPrice, DEFAULT_PLAN_CONFIG } = await import("./plan");
    expect(getSubscriptionPrice("starter", "monthly", DEFAULT_PLAN_CONFIG)).toBe(1990);
    expect(getSubscriptionPrice("starter", "annual", DEFAULT_PLAN_CONFIG)).toBe(19900);
    expect(getSubscriptionPrice("pro", "monthly", DEFAULT_PLAN_CONFIG)).toBe(3990);
    expect(getSubscriptionPrice("pro", "annual", DEFAULT_PLAN_CONFIG)).toBe(39900);
    expect(getSubscriptionPrice("max", "monthly", DEFAULT_PLAN_CONFIG)).toBe(6900);
    expect(getSubscriptionPrice("max", "annual", DEFAULT_PLAN_CONFIG)).toBe(69000);
  });

  it("ignores legacy saved pricing configs that predate Starter", async () => {
    const { mergePlanConfig } = await import("./plan");
    const config = mergePlanConfig({
      proMonthlyPriceLkr: 1490,
      proAnnualPriceLkr: 14300,
      maxMonthlyPriceLkr: 2490,
      maxAnnualPriceLkr: 23900,
      proLaunched: true,
      maxLaunched: true,
      plans: {
        trial: TRIAL_ENTITLEMENTS,
        pro: PRO_ENTITLEMENTS,
        max: MAX_ENTITLEMENTS,
        expired: EXPIRED_ENTITLEMENTS,
      } as Partial<PlanConfig["plans"]> as PlanConfig["plans"],
    });

    expect(config.starterMonthlyPriceLkr).toBe(1990);
    expect(config.proMonthlyPriceLkr).toBe(3990);
    expect(config.maxMonthlyPriceLkr).toBe(6900);
    expect(config.plans.starter).toEqual(STARTER_ENTITLEMENTS);
  });

  it("calculates annual savings percent", async () => {
    const { annualSavingsPercent } = await import("./plan");
    expect(annualSavingsPercent(1990, 19900)).toBe(17);
    expect(annualSavingsPercent(3990, 39900)).toBe(17);
    expect(annualSavingsPercent(6900, 69000)).toBe(17);
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
