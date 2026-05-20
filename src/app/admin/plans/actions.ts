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
  "automations",
  "broadcasts",
  "googleCalendarSync",
  "payments",
  "publicBookingPage",
  "publicBookingPageCustomization",
  "reports",
  "reviews",
  "reviewReplies",
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

export async function savePlans(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const current = getPlanConfig();

  const proMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("proMonthlyPriceLkr") ?? current.proMonthlyPriceLkr))
  );
  const proLaunched = formData.get("proLaunched") === "on";

  const next: PlanConfig = {
    proMonthlyPriceLkr,
    proLaunched,
    plans: {
      free: {
        limits: {
          bookingsPerMonth: parseLimit(formData.get("free.bookingsPerMonth")),
          staff: parseLimit(formData.get("free.staff")),
          services: parseLimit(formData.get("free.services")),
        },
        features: Object.fromEntries(
          FEATURE_KEYS.map((f) => [f, formData.get(`free.feature.${f}`) === "on"])
        ) as Record<PlanFeature, boolean>,
      },
      pro: {
        limits: {
          bookingsPerMonth: parseLimit(formData.get("pro.bookingsPerMonth")),
          staff: parseLimit(formData.get("pro.staff")),
          services: parseLimit(formData.get("pro.services")),
        },
        features: Object.fromEntries(
          FEATURE_KEYS.map((f) => [f, formData.get(`pro.feature.${f}`) === "on"])
        ) as Record<PlanFeature, boolean>,
      },
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
      proLaunched,
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

