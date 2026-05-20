import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = "free" | "pro";

export type PlanFeature =
  | "automations"
  | "broadcasts"
  | "googleCalendarSync"
  | "payments"
  | "publicBookingPage"
  | "publicBookingPageCustomization"
  | "reports"
  | "reviews"
  | "reviewReplies"
  | "webhooks"
  | "whatsappSms";

export type Entitlements = {
  limits: {
    bookingsPerMonth: number | null;
    staff: number | null;
    services: number | null;
  };
  features: Record<PlanFeature, boolean>;
};
export type PlanLimit = keyof Entitlements["limits"];

export type PlanConfig = {
  /** Editable: monthly price displayed in admin + dashboard billing UI. */
  proMonthlyPriceLkr: number;
  /** Whether Pro is "live" — i.e. enforced and billed. While false, Pro is "preview / free until release". */
  proLaunched: boolean;
  /** Editable per-plan entitlements. */
  plans: Record<Plan, Entitlements>;
  /** Audit: who last touched config + when. */
  updatedAt?: string;
  updatedBy?: string;
};

// ─── Defaults (used when no JSON config exists on disk) ──────────────────────

// These reflect the *current marketing reality* (LKR 1,490 launch price,
// unlimited Free bookings) rather than the previous in-code defaults.
const DEFAULT_FREE_ENTITLEMENTS: Entitlements = {
  limits: {
    bookingsPerMonth: null, // marketing promises unlimited on Free
    staff: 1,
    services: 5,
  },
  features: {
    automations: false,
    broadcasts: false,
    googleCalendarSync: false,
    payments: false,
    publicBookingPage: true,
    publicBookingPageCustomization: false,
    reports: false,
    reviews: true,
    reviewReplies: false,
    webhooks: false,
    whatsappSms: false,
  },
};

const DEFAULT_PRO_ENTITLEMENTS: Entitlements = {
  limits: {
    bookingsPerMonth: null,
    staff: null,
    services: null,
  },
  features: {
    automations: true,
    broadcasts: true,
    googleCalendarSync: true,
    payments: true,
    publicBookingPage: true,
    publicBookingPageCustomization: true,
    reports: true,
    reviews: true,
    reviewReplies: true,
    webhooks: true,
    whatsappSms: true,
  },
};

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  proMonthlyPriceLkr: Number(process.env.DINAYA_PRO_MONTHLY_PRICE_LKR ?? 1490),
  proLaunched: false,
  plans: {
    free: DEFAULT_FREE_ENTITLEMENTS,
    pro: DEFAULT_PRO_ENTITLEMENTS,
  },
};

/**
 * Features that are actually enforced somewhere in the codebase via
 * `requirePro(businessId, feature)`. Used by the admin UI to flag any
 * feature that's marketed but not gated.
 */
export const ENFORCED_FEATURES: readonly PlanFeature[] = [
  "automations",
  "payments",
  "webhooks",
] as const;

// ─── Config loader (reads .dinaya/plans.json with module-level cache) ────────

const CONFIG_DIR = path.join(process.cwd(), ".dinaya");
const CONFIG_FILE = path.join(CONFIG_DIR, "plans.json");

let cached: PlanConfig | null = null;

function loadFromDisk(): PlanConfig | null {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as PlanConfig;
    // Light validation: must have both plans
    if (!parsed.plans || !parsed.plans.free || !parsed.plans.pro) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getPlanConfig(): PlanConfig {
  if (cached) return cached;
  const fromDisk = loadFromDisk();
  cached = fromDisk ?? DEFAULT_PLAN_CONFIG;
  return cached;
}

export function invalidatePlanConfigCache(): void {
  cached = null;
}

export function savePlanConfig(next: PlanConfig): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
  } catch {
    // ignore
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), "utf8");
  cached = next;
}

// ─── Public API (backwards-compatible with previous exports) ─────────────────

export function getEntitlements(plan: Plan): Entitlements {
  return getPlanConfig().plans[plan];
}

export function canUseFeature(plan: Plan, feature: PlanFeature): boolean {
  return getEntitlements(plan).features[feature];
}

// Kept exported so tests and any older imports continue to compile.
export const FREE_ENTITLEMENTS = DEFAULT_FREE_ENTITLEMENTS;
export const PRO_ENTITLEMENTS = DEFAULT_PRO_ENTITLEMENTS;
export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: DEFAULT_FREE_ENTITLEMENTS,
  pro: DEFAULT_PRO_ENTITLEMENTS,
};

const FEATURE_LABELS: Record<PlanFeature, string> = {
  automations: "Automations",
  broadcasts: "Broadcasts",
  googleCalendarSync: "Google Calendar sync",
  payments: "PayHere payments",
  publicBookingPage: "Public booking page",
  publicBookingPageCustomization: "Booking page customization",
  reports: "Reports",
  reviews: "Reviews",
  reviewReplies: "Review replies",
  webhooks: "Webhooks and API",
  whatsappSms: "WhatsApp and SMS reminders",
};

export class PlanRequiredError extends Error {
  constructor(
    public readonly businessId: string,
    public readonly feature: PlanFeature = "reports"
  ) {
    super(`${FEATURE_LABELS[feature]} requires the Pro plan.`);
    this.name = "PlanRequiredError";
  }
}

export class PlanLimitError extends Error {
  constructor(
    public readonly limit: PlanLimit,
    public readonly max: number
  ) {
    super(`Your current plan allows up to ${max} ${limit}.`);
    this.name = "PlanLimitError";
  }
}

export async function getBusinessPlan(businessId: string): Promise<Plan> {
  const [{ db }, { businesses }, { eq }] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);

  const [business] = await db
    .select({ plan: businesses.plan })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return business?.plan ?? "free";
}

export async function requirePro(
  businessId: string,
  feature: PlanFeature = "reports"
): Promise<void> {
  const plan = await getBusinessPlan(businessId);

  if (!canUseFeature(plan, feature)) {
    throw new PlanRequiredError(businessId, feature);
  }
}

export async function requirePlanLimit(
  businessId: string,
  limit: PlanLimit,
  currentCount: number
): Promise<void> {
  const plan = await getBusinessPlan(businessId);
  const max = getEntitlements(plan).limits[limit];

  if (max !== null && currentCount >= max) {
    throw new PlanLimitError(limit, max);
  }
}

export async function ProGate({
  businessId,
  children,
  feature,
}: {
  businessId?: string;
  children: ReactNode;
  feature: PlanFeature;
}) {
  const plan = businessId
    ? await getBusinessPlan(businessId)
    : (await import("@/lib/auth")).requireBusiness().then((ctx) => ctx.business.plan);

  if (canUseFeature(await plan, feature)) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-5 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-violet-950">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-violet-600 text-white">
          <i className="bi bi-stars text-sm" aria-hidden="true" />
        </span>
        Upgrade to Pro
      </div>
      <p className="text-violet-900/75">
        {FEATURE_LABELS[feature]} is available on Dinaya Pro.
      </p>
      <a
        href="/dashboard/settings"
        className="mt-4 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        View plan options
      </a>
    </div>
  );
}
