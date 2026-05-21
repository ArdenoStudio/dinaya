import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = "free" | "pro" | "max";
export type BillingInterval = "monthly" | "annual";
export type PaidPlan = "pro" | "max";

export type PlanFeature =
  | "aiBookingAutopilot"
  | "aiContentMachine"
  | "aiUpsellAssistant"
  | "automations"
  | "broadcasts"
  | "clientReactivationCampaign"
  | "googleCalendarSync"
  | "payments"
  | "publicBookingPage"
  | "publicBookingPageCustomization"
  | "reports"
  | "reviewEngine"
  | "reviews"
  | "reviewReplies"
  | "smartReminderSystem"
  | "vipLoyaltySequence"
  | "webhooks"
  | "whatsappSms";

export const AI_FEATURES: readonly PlanFeature[] = [
  "aiBookingAutopilot",
  "smartReminderSystem",
  "reviewEngine",
  "clientReactivationCampaign",
  "aiUpsellAssistant",
  "aiContentMachine",
  "vipLoyaltySequence",
] as const;

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
  proMonthlyPriceLkr: number;
  proAnnualPriceLkr: number;
  maxMonthlyPriceLkr: number;
  maxAnnualPriceLkr: number;
  proLaunched: boolean;
  maxLaunched: boolean;
  plans: Record<Plan, Entitlements>;
  updatedAt?: string;
  updatedBy?: string;
};

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  max: 2,
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FREE_ENTITLEMENTS: Entitlements = {
  limits: {
    bookingsPerMonth: null,
    staff: 1,
    services: 5,
  },
  features: {
    aiBookingAutopilot: false,
    aiContentMachine: false,
    aiUpsellAssistant: false,
    automations: false,
    broadcasts: false,
    clientReactivationCampaign: false,
    googleCalendarSync: false,
    payments: false,
    publicBookingPage: true,
    publicBookingPageCustomization: false,
    reports: false,
    reviewEngine: false,
    reviews: true,
    reviewReplies: false,
    smartReminderSystem: false,
    vipLoyaltySequence: false,
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
    aiBookingAutopilot: false,
    aiContentMachine: false,
    aiUpsellAssistant: false,
    automations: true,
    broadcasts: true,
    clientReactivationCampaign: false,
    googleCalendarSync: true,
    payments: true,
    publicBookingPage: true,
    publicBookingPageCustomization: true,
    reports: true,
    reviewEngine: false,
    reviews: true,
    reviewReplies: true,
    smartReminderSystem: false,
    vipLoyaltySequence: false,
    webhooks: true,
    whatsappSms: true,
  },
};

const DEFAULT_MAX_ENTITLEMENTS: Entitlements = {
  limits: {
    bookingsPerMonth: null,
    staff: null,
    services: null,
  },
  features: {
    aiBookingAutopilot: true,
    aiContentMachine: true,
    aiUpsellAssistant: true,
    automations: true,
    broadcasts: true,
    clientReactivationCampaign: true,
    googleCalendarSync: true,
    payments: true,
    publicBookingPage: true,
    publicBookingPageCustomization: true,
    reports: true,
    reviewEngine: true,
    reviews: true,
    reviewReplies: true,
    smartReminderSystem: true,
    vipLoyaltySequence: true,
    webhooks: true,
    whatsappSms: true,
  },
};

export const DEFAULT_PLAN_CONFIG: PlanConfig = {
  proMonthlyPriceLkr: Number(process.env.DINAYA_PRO_MONTHLY_PRICE_LKR ?? 1490),
  proAnnualPriceLkr: Number(process.env.DINAYA_PRO_ANNUAL_PRICE_LKR ?? 14900),
  maxMonthlyPriceLkr: Number(process.env.DINAYA_MAX_MONTHLY_PRICE_LKR ?? 2490),
  maxAnnualPriceLkr: Number(process.env.DINAYA_MAX_ANNUAL_PRICE_LKR ?? 24900),
  proLaunched: false,
  maxLaunched: false,
  plans: {
    free: DEFAULT_FREE_ENTITLEMENTS,
    pro: DEFAULT_PRO_ENTITLEMENTS,
    max: DEFAULT_MAX_ENTITLEMENTS,
  },
};

export const ENFORCED_FEATURES: readonly PlanFeature[] = [
  "automations",
  "payments",
  "webhooks",
] as const;

// ─── Config loader ────────────────────────────────────────────────────────────

const CONFIG_DIR = path.join(process.cwd(), ".dinaya");
const CONFIG_FILE = path.join(CONFIG_DIR, "plans.json");

let cached: PlanConfig | null = null;

function mergeEntitlements(
  defaults: Entitlements,
  fromDisk: Partial<Entitlements> | undefined
): Entitlements {
  return {
    limits: {
      bookingsPerMonth:
        fromDisk?.limits?.bookingsPerMonth ?? defaults.limits.bookingsPerMonth,
      staff: fromDisk?.limits?.staff ?? defaults.limits.staff,
      services: fromDisk?.limits?.services ?? defaults.limits.services,
    },
    features: {
      ...defaults.features,
      ...fromDisk?.features,
    },
  };
}

function mergePlanConfig(fromDisk: Partial<PlanConfig>): PlanConfig {
  return {
    proMonthlyPriceLkr:
      fromDisk.proMonthlyPriceLkr ?? DEFAULT_PLAN_CONFIG.proMonthlyPriceLkr,
    proAnnualPriceLkr:
      fromDisk.proAnnualPriceLkr ?? DEFAULT_PLAN_CONFIG.proAnnualPriceLkr,
    maxMonthlyPriceLkr:
      fromDisk.maxMonthlyPriceLkr ?? DEFAULT_PLAN_CONFIG.maxMonthlyPriceLkr,
    maxAnnualPriceLkr:
      fromDisk.maxAnnualPriceLkr ?? DEFAULT_PLAN_CONFIG.maxAnnualPriceLkr,
    proLaunched: fromDisk.proLaunched ?? DEFAULT_PLAN_CONFIG.proLaunched,
    maxLaunched: fromDisk.maxLaunched ?? DEFAULT_PLAN_CONFIG.maxLaunched,
    plans: {
      free: mergeEntitlements(
        DEFAULT_FREE_ENTITLEMENTS,
        fromDisk.plans?.free
      ),
      pro: mergeEntitlements(DEFAULT_PRO_ENTITLEMENTS, fromDisk.plans?.pro),
      max: mergeEntitlements(DEFAULT_MAX_ENTITLEMENTS, fromDisk.plans?.max),
    },
    updatedAt: fromDisk.updatedAt,
    updatedBy: fromDisk.updatedBy,
  };
}

function loadFromDisk(): PlanConfig | null {
  try {
    const raw = readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<PlanConfig>;
    if (!parsed.plans?.free || !parsed.plans?.pro) return null;
    return mergePlanConfig(parsed);
  } catch {
    return null;
  }
}

export function getPlanConfig(): PlanConfig {
  if (cached) return cached;
  cached = loadFromDisk() ?? DEFAULT_PLAN_CONFIG;
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan];
}


export function getSubscriptionPrice(
  plan: PaidPlan,
  interval: BillingInterval,
  config: PlanConfig = getPlanConfig()
): number {
  if (interval === "annual") {
    return plan === "pro" ? config.proAnnualPriceLkr : config.maxAnnualPriceLkr;
  }
  return plan === "pro" ? config.proMonthlyPriceLkr : config.maxMonthlyPriceLkr;
}

export function payhereRecurrence(interval: BillingInterval): string {
  return interval === "annual" ? "1 Year" : "1 Month";
}

export function subscriptionItemName(plan: PaidPlan, interval: BillingInterval): string {
  const tier = plan === "max" ? "Max" : "Pro";
  const cadence = interval === "annual" ? "annual" : "monthly";
  return `Dinaya ${tier} — ${cadence} subscription`;
}

export function annualSavingsPercent(monthlyLkr: number, annualLkr: number): number {
  const fullYear = monthlyLkr * 12;
  if (fullYear <= 0) return 0;
  return Math.max(0, Math.round(((fullYear - annualLkr) / fullYear) * 100));
}

export function planDisplayName(plan: Plan): string {
  if (plan === "max") return "Max";
  if (plan === "pro") return "Pro";
  return "Free";
}

export function isPaidPlan(plan: Plan): boolean {
  return plan === "pro" || plan === "max";
}

export function minimumPlanForFeature(feature: PlanFeature): Plan {
  return AI_FEATURES.includes(feature) ? "max" : "pro";
}

export function getEntitlements(plan: Plan): Entitlements {
  return getPlanConfig().plans[plan];
}

/** Max inherits Pro operational entitlements at runtime. */
export function getEffectiveEntitlements(plan: Plan): Entitlements {
  const config = getPlanConfig();
  if (plan === "max") {
    return {
      limits: config.plans.max.limits,
      features: {
        ...config.plans.pro.features,
        ...config.plans.max.features,
      },
    };
  }
  return config.plans[plan];
}

export function canUseFeature(plan: Plan, feature: PlanFeature): boolean {
  return getEffectiveEntitlements(plan).features[feature];
}

export const FREE_ENTITLEMENTS = DEFAULT_FREE_ENTITLEMENTS;
export const PRO_ENTITLEMENTS = DEFAULT_PRO_ENTITLEMENTS;
export const MAX_ENTITLEMENTS = DEFAULT_MAX_ENTITLEMENTS;
export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: DEFAULT_FREE_ENTITLEMENTS,
  pro: DEFAULT_PRO_ENTITLEMENTS,
  max: DEFAULT_MAX_ENTITLEMENTS,
};

const FEATURE_LABELS: Record<PlanFeature, string> = {
  aiBookingAutopilot: "AI Booking Autopilot",
  aiContentMachine: "30-Day AI Content Machine",
  aiUpsellAssistant: "AI upsell assistant",
  automations: "Automations",
  broadcasts: "Broadcasts",
  clientReactivationCampaign: "Client Reactivation Campaign",
  googleCalendarSync: "Google Calendar sync",
  payments: "PayHere payments",
  publicBookingPage: "Public booking page",
  publicBookingPageCustomization: "Booking page customization",
  reports: "Reports",
  reviewEngine: "Review engine",
  reviews: "Reviews",
  reviewReplies: "Review replies",
  smartReminderSystem: "Smart reminder system",
  vipLoyaltySequence: "VIP Loyalty Sequence",
  webhooks: "Webhooks and API",
  whatsappSms: "WhatsApp and SMS reminders",
};

export class PlanRequiredError extends Error {
  constructor(
    public readonly businessId: string,
    public readonly feature: PlanFeature = "reports",
    public readonly requiredPlan: Plan = "pro"
  ) {
    super(
      `${FEATURE_LABELS[feature]} requires the ${planDisplayName(requiredPlan)} plan.`
    );
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

  return (business?.plan as Plan | undefined) ?? "free";
}

export async function requirePro(
  businessId: string,
  feature: PlanFeature = "reports"
): Promise<void> {
  const plan = await getBusinessPlan(businessId);
  const requiredPlan = minimumPlanForFeature(feature);

  if (!canUseFeature(plan, feature)) {
    throw new PlanRequiredError(businessId, feature, requiredPlan);
  }
}

export async function requirePlanLimit(
  businessId: string,
  limit: PlanLimit,
  currentCount: number
): Promise<void> {
  const plan = await getBusinessPlan(businessId);
  const max = getEffectiveEntitlements(plan).limits[limit];

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
    : (await import("@/lib/auth")).requireBusiness().then((ctx) => ctx.business.plan as Plan);

  if (canUseFeature(await plan, feature)) {
    return <>{children}</>;
  }

  const requiredPlan = minimumPlanForFeature(feature);

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-5 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-violet-950">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-violet-600 text-white">
          <i className="bi bi-stars text-sm" aria-hidden="true" />
        </span>
        Upgrade to {planDisplayName(requiredPlan)}
      </div>
      <p className="text-violet-900/75">
        {FEATURE_LABELS[feature]} is available on Dinaya {planDisplayName(requiredPlan)}.
      </p>
      <a
        href="/dashboard/billing"
        className="mt-4 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        View plan options
      </a>
    </div>
  );
}
