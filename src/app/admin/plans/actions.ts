"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import {
  getPlanConfigAsync,
  savePlanConfigAsync,
  type Plan,
  type PlanConfig,
  type PlanFeature,
} from "@/lib/plan";
import { logAdminEvent } from "@/lib/admin-audit";

const FEATURE_KEYS: PlanFeature[] = [
  "aiBookingAutopilot",
  "aiContentMachine",
  "aiUpsellAssistant",
  "aiVoiceReceptionist",
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
      locations: parseLimit(formData.get(`${planKey}.locations`)),
    },
    features: Object.fromEntries(
      FEATURE_KEYS.map((f) => [f, formData.get(`${planKey}.feature.${f}`) === "on"])
    ) as Record<PlanFeature, boolean>,
  };
}

export async function savePlans(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const current = await getPlanConfigAsync();

  const proMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("proMonthlyPriceLkr") ?? current.proMonthlyPriceLkr))
  );
  const proAnnualPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("proAnnualPriceLkr") ?? current.proAnnualPriceLkr))
  );
  const maxMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("maxMonthlyPriceLkr") ?? current.maxMonthlyPriceLkr))
  );
  const maxAnnualPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("maxAnnualPriceLkr") ?? current.maxAnnualPriceLkr))
  );
  const proLaunched = formData.get("proLaunched") === "on";
  const maxLaunched = formData.get("maxLaunched") === "on";

  const next: PlanConfig = {
    proMonthlyPriceLkr,
    proAnnualPriceLkr,
    maxMonthlyPriceLkr,
    maxAnnualPriceLkr,
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

  await savePlanConfigAsync(next);

  await logAdminEvent({
    actorEmail: admin.email,
    action: "plans.updated",
    meta: {
      proMonthlyPriceLkr,
      proAnnualPriceLkr,
      maxMonthlyPriceLkr,
      maxAnnualPriceLkr,
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
  await savePlanConfigAsync({
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
