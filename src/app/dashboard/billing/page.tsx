import Link from "next/link";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  dashboardPageClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import {
  annualSavingsPercent,
  getPlanConfigAsync,
  isPaidPlan,
  isPaidPlanAvailable,
  planDisplayName,
  resolveEffectivePlan,
  type PaidPlan,
} from "@/lib/plan";
import { PlanPricingActions } from "./PlanPricingActions";
import { CancelButton } from "./CancelButton";
import { BillingReturnBanner } from "./BillingReturnBanner";

function formatRs(amount: number) {
  return amount.toLocaleString("en-LK");
}

// Kept out of component render so the impure `Date.now()` call isn't evaluated
// during render (react-hooks/purity).
function trialDaysLeftFrom(planExpiresAt: Date | null | undefined): number | null {
  if (!planExpiresAt) return null;
  return Math.max(
    0,
    Math.ceil((planExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

function PlanPricing({
  monthlyLkr,
  annualLkr,
  targetPlan,
  available,
}: {
  monthlyLkr: number;
  annualLkr: number;
  targetPlan: PaidPlan;
  available: boolean;
}) {
  const savings = annualSavingsPercent(monthlyLkr, annualLkr);
  const targetLabel = planDisplayName(targetPlan);

  return (
    <>
      <div className="mt-4 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">Rs {formatRs(monthlyLkr)}</span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <p className="text-sm text-muted-foreground">
          or Rs {formatRs(annualLkr)} / year
          {savings > 0 && (
            <span className="ml-1 font-medium text-emerald-700">· save {savings}%</span>
          )}
        </p>
      </div>
      {available ? (
        <PlanPricingActions
          monthlyLkr={monthlyLkr}
          annualLkr={annualLkr}
          targetPlan={targetPlan}
          available={available}
          savings={savings}
        />
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          {targetLabel} checkout is not open yet. Contact support for early access.
        </p>
      )}
    </>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const { businessId } = await requireOwner();
  const params = await searchParams;
  const config = await getPlanConfigAsync();
  const {
    starterMonthlyPriceLkr,
    starterAnnualPriceLkr,
    proMonthlyPriceLkr,
    proAnnualPriceLkr,
    maxMonthlyPriceLkr,
    maxAnnualPriceLkr,
  } = config;

  const [business] = await db
    .select({
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const [activeSub] = await db
    .select({
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
    })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.businessId, businessId),
      inArray(subscriptions.status, ["pending", "active", "past_due"]),
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const plan = resolveEffectivePlan({
    storedPlan: business?.plan,
    planExpiresAt: business?.planExpiresAt,
  });
  const isPaid = isPaidPlan(plan);

  const trialDaysLeft =
    plan === "trial" ? trialDaysLeftFrom(business?.planExpiresAt) : null;

  return (
    <div className={cn(dashboardPageClass, "max-w-3xl")}>
      <BillingReturnBanner
        success={params.success === "1"}
        cancelled={params.cancelled === "1"}
      />
      <DashboardPageHeader
        title="Billing"
        description="Manage your Dinaya plan and subscription."
      />

      <DashboardSection title="Current plan">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">
              {planDisplayName(plan)}
            </div>
            {business?.planExpiresAt && (
              <div className="mt-1 text-sm text-muted-foreground">
                {isPaid ? "Renews" : "Expires"} on{" "}
                {business.planExpiresAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
            {activeSub && (
              <div className="mt-1 text-sm text-muted-foreground">
                {activeSub.status === "pending"
                  ? "Checkout in progress"
                  : `Billed ${activeSub.billingInterval === "annual" ? "annually" : "monthly"}`}
              </div>
            )}
          </div>
          {isPaid && activeSub?.status === "past_due" && (
            <StatusBadge status="past_due" className="shrink-0" />
          )}
        </div>
      </DashboardSection>

      {plan === "trial" && (
        <DashboardSection
          muted
          title={
            trialDaysLeft !== null && trialDaysLeft > 0
              ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in your free trial`
              : "Your free trial ends today"
          }
        >
          <p className="text-sm text-muted-foreground">
            Your trial includes Starter and Pro tools, with Growth previews kept limited.
            Subscribe before it ends to keep your booking page online without interruption.
          </p>
        </DashboardSection>
      )}

      {plan === "expired" && (
        <DashboardSection muted title="Your free trial has ended">
          <p className="text-sm text-muted-foreground">
            Your public booking page is offline and new bookings are paused. Your data is safe —
            subscribe to a plan below to reactivate your account.
          </p>
        </DashboardSection>
      )}

      {(plan === "trial" || plan === "expired") && (
        <>
          <DashboardSection
            title="Subscribe to Starter"
            description="Public booking page, PayHere payments, unlimited bookings, 1 branch, 2 staff, and 10 services."
          >
            <PlanPricing
              monthlyLkr={starterMonthlyPriceLkr}
              annualLkr={starterAnnualPriceLkr}
              targetPlan="starter"
              available={isPaidPlanAvailable("starter", config)}
            />
          </DashboardSection>

          <DashboardSection
            title="Upgrade to Pro"
            description="Main plan for serious small businesses: 1 branch, 5 staff, reviews, reports, Google Calendar, and reminder credits."
          >
            <PlanPricing
              monthlyLkr={proMonthlyPriceLkr}
              annualLkr={proAnnualPriceLkr}
              targetPlan="pro"
              available={isPaidPlanAvailable("pro", config)}
            />
          </DashboardSection>

          <DashboardSection
            title="Upgrade to Growth"
            description="Automation and AI growth: 3 branches, 15 staff, custom domain, branding removal, and AI workflows."
          >
            <PlanPricing
              monthlyLkr={maxMonthlyPriceLkr}
              annualLkr={maxAnnualPriceLkr}
              targetPlan="max"
              available={isPaidPlanAvailable("max", config)}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Cancel anytime — you keep your plan until the period ends.
            </p>
          </DashboardSection>
        </>
      )}

      {plan === "starter" && (
        <>
          <DashboardSection
            title="Upgrade to Pro"
            description="Add reviews, reports, Google Calendar sync, automations, and reminder credits for a growing team."
          >
            <PlanPricing
              monthlyLkr={proMonthlyPriceLkr}
              annualLkr={proAnnualPriceLkr}
              targetPlan="pro"
              available={isPaidPlanAvailable("pro", config)}
            />
          </DashboardSection>

          <DashboardSection
            title="Upgrade to Growth"
            description="Add AI workflows, custom domain, branding removal, and 3-branch scale."
          >
            <PlanPricing
              monthlyLkr={maxMonthlyPriceLkr}
              annualLkr={maxAnnualPriceLkr}
              targetPlan="max"
              available={isPaidPlanAvailable("max", config)}
            />
          </DashboardSection>
        </>
      )}

      {plan === "pro" && (
        <DashboardSection
          title="Upgrade to Growth"
          description="Unlock AI growth workflows, custom domain, branding removal, and 3-branch scale. AI Voice Receptionist is coming later."
        >
          <PlanPricing
            monthlyLkr={maxMonthlyPriceLkr}
            annualLkr={maxAnnualPriceLkr}
            targetPlan="max"
            available={isPaidPlanAvailable("max", config)}
          />
        </DashboardSection>
      )}

      {isPaid && activeSub && (
        <DashboardSection
          title="Manage subscription"
          description={`Cancel anytime. You'll keep ${planDisplayName(plan)} features until the current period ends.`}
        >
          <CancelButton plan={plan} />
        </DashboardSection>
      )}

      <p className="text-xs text-muted-foreground">
        Questions about billing?{" "}
        <Link href="/contact" className="underline">Contact support</Link>.
      </p>
    </div>
  );
}
