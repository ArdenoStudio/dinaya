"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import {
  getPlanConfig,
  savePlanConfig,
  type Plan,
  type PlanConfig,
  type PlanFeature,
} from "@/lib/plan";
import { logAdminEvent } from "@/lib/admin-audit";

const FEATURE_KEYS: PlanFeature[] = [
  "aiBookingAutopilot",
  "aiContentMachine",
  "aiUpsellAssistant",
  "automations",
  "broadcasts",
  "clientReactivationCampaign",
  "googleCalendarSync",
  "payments",
  "publicBookingPage",
  "publicBookingPageCustomization",
  "reports",
  "reviewEngine",
  "reviews",
  "reviewReplies",
  "smartReminderSystem",
  "vipLoyaltySequence",
  "webhooks",
  "whatsappSms",
];

const PAID_PLANS: Plan[] = ["pro", "max"];

function parseLimit(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw || raw.toLowerCase() === "unlimited" || raw === "-") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function buildPlanEntitlements(formData: FormData, planKey: Plan) {
  return {
    limits: {
      bookingsPerMonth: parseLimit(formData.get(`${planKey}.bookingsPerMonth`)),
      staff: parseLimit(formData.get(`${planKey}.staff`)),
      services: parseLimit(formData.get(`${planKey}.services`)),
    },
    features: Object.fromEntries(
      FEATURE_KEYS.map((f) => [f, formData.get(`${planKey}.feature.${f}`) === "on"])
    ) as Record<PlanFeature, boolean>,
  };
}

export async function savePlans(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const current = getPlanConfig();

  const proMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("proMonthlyPriceLkr") ?? current.proMonthlyPriceLkr))
  );
  const maxMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("maxMonthlyPriceLkr") ?? current.maxMonthlyPriceLkr))
  );
  const proLaunched = formData.get("proLaunched") === "on";
  const maxLaunched = formData.get("maxLaunched") === "on";

  const next: PlanConfig = {
    proMonthlyPriceLkr,
    maxMonthlyPriceLkr,
    proLaunched,
    maxLaunched,
    plans: {
      free: buildPlanEntitlements(formData, "free"),
      pro: buildPlanEntitlements(formData, "pro"),
      max: buildPlanEntitlements(formData, "max"),
    },
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email,
  };

  savePlanConfig(next);

  await logAdminEvent({
    actorEmail: admin.email,
    action: "plans.updated",
    meta: {
      proMonthlyPriceLkr,
      maxMonthlyPriceLkr,
      proLaunched,
      maxLaunched,
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath("/admin");
  revalidatePath("/dashboard/billing");
}

export async function resetPlansToDefaults(): Promise<void> {
  const admin = await requirePlatformAdmin();
  const { DEFAULT_PLAN_CONFIG } = await import("@/lib/plan");
  savePlanConfig({
    ...DEFAULT_PLAN_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email,
  });
  await logAdminEvent({
    actorEmail: admin.email,
    action: "plans.reset_to_defaults",
  });
  revalidatePath("/admin/plans");
}
