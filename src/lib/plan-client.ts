import type { PlanFeature } from "@/lib/plan";

const PLAN_LABELS = {
  pro: "Pro",
  max: "Growth",
  starter: "Starter",
} as const;

const FEATURE_MIN_PLAN: Partial<Record<PlanFeature, keyof typeof PLAN_LABELS>> = {
  bookingPageTheme: "pro",
  publicBookingPageCustomization: "max",
};

const FEATURE_LABELS: Partial<Record<PlanFeature, string>> = {
  bookingPageTheme: "Booking page colors & hero",
  publicBookingPageCustomization: "Booking page customization",
};

export function themeEditorPlanLabel(feature: PlanFeature): string {
  return PLAN_LABELS[FEATURE_MIN_PLAN[feature] ?? "pro"];
}

export function themeEditorFeatureLabel(feature: PlanFeature): string {
  return FEATURE_LABELS[feature] ?? "This feature";
}
