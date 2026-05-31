import Link from "next/link";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  annualSavingsPercent,
  getPlanConfigAsync,
  isPaidPlan,
  isPaidPlanAvailable,
  planDisplayName,
  resolveEffectivePlan,
  type PaidPlan,
} from "@/lib/plan";
import { UpgradeButton } from "./UpgradeButton";
import { CancelButton } from "./CancelButton";

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
          <span className="text-sm text-neutral-500">/ month</span>
        </div>
        <p className="text-sm text-neutral-600">
          or Rs {formatRs(annualLkr)} / year
          {savings > 0 && (
            <span className="ml-1 font-medium text-emerald-700">· save {savings}%</span>
          )}
        </p>
      </div>
      {available ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <UpgradeButton targetPlan={targetPlan} interval="monthly" />
          <UpgradeButton
            targetPlan={targetPlan}
            interval="annual"
            variant="secondary"
            label={savings > 0 ? `Annual · save ${savings}%` : "Annual"}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-neutral-600">
          {targetLabel} checkout is not open yet. Contact support for early access.
        </p>
      )}
    </>
  );
}

export default async function BillingPage() {
  const { businessId } = await requireOwner();
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
    <div className="max-w-3xl space-y-6">
      <DashboardPageHeader
        title="Billing"
        description="Manage your Dinaya plan and subscription."
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">Current plan</div>
            <div className="mt-1 text-xl font-semibold">
              {planDisplayName(plan)}
            </div>
            {business?.planExpiresAt && (
              <div className="mt-1 text-sm text-neutral-500">
                {isPaid ? "Renews" : "Expires"} on{" "}
                {business.planExpiresAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
            {activeSub && (
              <div className="mt-1 text-sm text-neutral-500">
                {activeSub.status === "pending"
                  ? "Checkout in progress"
                  : `Billed ${activeSub.billingInterval === "annual" ? "annually" : "monthly"}`}
              </div>
            )}
          </div>
          {isPaid && activeSub?.status === "past_due" && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/30">
              Payment past due
            </span>
          )}
        </div>
      </section>

      {plan === "trial" && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            {trialDaysLeft !== null && trialDaysLeft > 0
              ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in your free trial`
              : "Your free trial ends today"}
          </h2>
          <p className="mt-1 text-sm text-blue-900/80">
            Your trial includes Starter and Pro tools, with Growth previews kept limited.
            Subscribe before it ends to keep your booking page online without interruption.
          </p>
        </section>
      )}

      {plan === "expired" && (
        <section className="rounded-xl border border-red-200 bg-red-50/70 p-6">
          <h2 className="text-lg font-semibold text-red-900">Your free trial has ended</h2>
          <p className="mt-1 text-sm text-red-900/80">
            Your public booking page is offline and new bookings are paused. Your data is safe —
            subscribe to a plan below to reactivate your account.
          </p>
        </section>
      )}

      {(plan === "trial" || plan === "expired") && (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Subscribe to Starter</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Public booking page, PayHere payments, unlimited bookings, 1 branch, 2 staff, and 10 services.
            </p>
            <PlanPricing
              monthlyLkr={starterMonthlyPriceLkr}
              annualLkr={starterAnnualPriceLkr}
              targetPlan="starter"
              available={isPaidPlanAvailable("starter", config)}
            />
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Main plan for serious small businesses: 1 branch, 5 staff, reviews, reports, Google Calendar, and reminder credits.
            </p>
            <PlanPricing
              monthlyLkr={proMonthlyPriceLkr}
              annualLkr={proAnnualPriceLkr}
              targetPlan="pro"
              available={isPaidPlanAvailable("pro", config)}
            />
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Growth</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Automation and AI growth: 3 branches, 15 staff, custom domain, branding removal, and AI workflows.
            </p>
            <PlanPricing
              monthlyLkr={maxMonthlyPriceLkr}
              annualLkr={maxAnnualPriceLkr}
              targetPlan="max"
              available={isPaidPlanAvailable("max", config)}
            />
            <p className="mt-3 text-xs text-neutral-500">
              Cancel anytime — you keep your plan until the period ends.
            </p>
          </section>
        </>
      )}

      {plan === "starter" && (
        <>
          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Add reviews, reports, Google Calendar sync, automations, and reminder credits for a growing team.
            </p>
            <PlanPricing
              monthlyLkr={proMonthlyPriceLkr}
              annualLkr={proAnnualPriceLkr}
              targetPlan="pro"
              available={isPaidPlanAvailable("pro", config)}
            />
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Growth</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Add AI workflows, custom domain, branding removal, and 3-branch scale.
            </p>
            <PlanPricing
              monthlyLkr={maxMonthlyPriceLkr}
              annualLkr={maxAnnualPriceLkr}
              targetPlan="max"
              available={isPaidPlanAvailable("max", config)}
            />
          </section>
        </>
      )}

      {plan === "pro" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-lg font-semibold">Upgrade to Growth</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Unlock AI growth workflows, custom domain, branding removal, and 3-branch scale. AI Voice Receptionist is coming later.
          </p>
          <PlanPricing
            monthlyLkr={maxMonthlyPriceLkr}
            annualLkr={maxAnnualPriceLkr}
            targetPlan="max"
            available={isPaidPlanAvailable("max", config)}
          />
        </section>
      )}

      {isPaid && activeSub && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Manage subscription</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Cancel anytime. You&apos;ll keep {planDisplayName(plan)} features until the current period ends.
          </p>
          <div className="mt-4">
            <CancelButton />
          </div>
        </section>
      )}

      <p className="text-xs text-neutral-500">
        Questions about billing?{" "}
        <Link href="/contact" className="underline">Contact support</Link>.
      </p>
    </div>
  );
}
