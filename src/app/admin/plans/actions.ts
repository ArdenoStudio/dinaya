"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminFromSession } from "@/lib/platform-admin";
import {
  getPlanConfigAsync,
  savePlanConfigAsync,
  type Plan,
  type PlanConfig,
  type PlanFeature,
} from "@/lib/plan";
import { logAdminEvent } from "@/lib/admin-audit";
import { PLAN_FEATURE_ORDER } from "@/lib/plan-feature-order";

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
      whatsappMessagesPerMonth: parseLimit(formData.get(`${planKey}.whatsappMessagesPerMonth`)),
    },
    features: Object.fromEntries(
      PLAN_FEATURE_ORDER.map((f) => [f, formData.get(`${planKey}.feature.${f}`) === "on"])
    ) as Record<PlanFeature, boolean>,
  };
}

export async function savePlans(formData: FormData): Promise<void> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);
  const current = await getPlanConfigAsync();

  const starterMonthlyPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("starterMonthlyPriceLkr") ?? current.starterMonthlyPriceLkr))
  );
  const starterAnnualPriceLkr = Math.max(
    0,
    Math.floor(Number(formData.get("starterAnnualPriceLkr") ?? current.starterAnnualPriceLkr))
  );
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
  const starterLaunched = formData.get("starterLaunched") === "on";
  const proLaunched = formData.get("proLaunched") === "on";
  const maxLaunched = formData.get("maxLaunched") === "on";

  const next: PlanConfig = {
    starterMonthlyPriceLkr,
    starterAnnualPriceLkr,
    proMonthlyPriceLkr,
    proAnnualPriceLkr,
    maxMonthlyPriceLkr,
    maxAnnualPriceLkr,
    starterLaunched,
    proLaunched,
    maxLaunched,
    plans: {
      trial: buildPlanEntitlements(formData, "trial"),
      starter: buildPlanEntitlements(formData, "starter"),
      pro: buildPlanEntitlements(formData, "pro"),
      max: buildPlanEntitlements(formData, "max"),
      expired: current.plans.expired,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: admin.email,
  };

  await savePlanConfigAsync(next);

  await logAdminEvent({
    actorEmail: admin.email,
    action: "plans.updated",
    meta: {
      starterMonthlyPriceLkr,
      starterAnnualPriceLkr,
      proMonthlyPriceLkr,
      proAnnualPriceLkr,
      maxMonthlyPriceLkr,
      maxAnnualPriceLkr,
      starterLaunched,
      proLaunched,
      maxLaunched,
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  revalidatePath("/dashboard/billing");
}

export async function resetPlansToDefaults(): Promise<void> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);
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
  revalidatePath("/pricing");
  revalidatePath("/dashboard/billing");
}
