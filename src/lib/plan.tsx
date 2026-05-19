import type { ReactNode } from "react";

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

type Entitlements = {
  limits: {
    bookingsPerMonth: number | null;
    staff: number | null;
    services: number | null;
  };
  features: Record<PlanFeature, boolean>;
};
export type PlanLimit = keyof Entitlements["limits"];

export const FREE_ENTITLEMENTS = {
  limits: {
    bookingsPerMonth: 50,
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
} satisfies Entitlements;

export const PRO_ENTITLEMENTS = {
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
} satisfies Entitlements;

export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: FREE_ENTITLEMENTS,
  pro: PRO_ENTITLEMENTS,
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

export function getEntitlements(plan: Plan): Entitlements {
  return PLAN_ENTITLEMENTS[plan];
}

export function canUseFeature(plan: Plan, feature: PlanFeature): boolean {
  return PLAN_ENTITLEMENTS[plan].features[feature];
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
  const max = PLAN_ENTITLEMENTS[plan].limits[limit];

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
