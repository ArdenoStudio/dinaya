import Link from "next/link";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import {
  annualSavingsPercent,
  getPlanConfigAsync,
  isPaidPlanAvailable,
  planDisplayName,
  resolveEffectivePlan,
  type Plan,
} from "@/lib/plan";
import { UpgradeButton } from "./UpgradeButton";
import { CancelButton } from "./CancelButton";

function formatRs(amount: number) {
  return amount.toLocaleString("en-LK");
}

function PlanPricing({
  monthlyLkr,
  annualLkr,
  targetPlan,
  available,
}: {
  monthlyLkr: number;
  annualLkr: number;
  targetPlan: "pro" | "max";
  available: boolean;
}) {
  const savings = annualSavingsPercent(monthlyLkr, annualLkr);

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
          {targetPlan === "max" ? "Max" : "Pro"} checkout is not open yet. Contact support for early access.
        </p>
      )}
    </>
  );
}

export default async function BillingPage() {
  const { businessId } = await requireOwner();
  const config = await getPlanConfigAsync();
  const {
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
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.businessId, businessId),
      inArray(subscriptions.status, ["pending", "active", "past_due"]),
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const plan = resolveEffectivePlan({
    storedPlan: (business?.plan ?? "free") as Plan,
    planExpiresAt: business?.planExpiresAt,
  });
  const isPaid = plan === "pro" || plan === "max";

  return (
    <div className="max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage your Dinaya plan and subscription.
        </p>
      </header>

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

      {plan === "free" && (
        <>
          <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Up to 3 branches, all seven AI growth workflows, multi-staff calendar,
              branding control, advanced reports, and priority WhatsApp support.
            </p>
            <PlanPricing
              monthlyLkr={proMonthlyPriceLkr}
              annualLkr={proAnnualPriceLkr}
              targetPlan="pro"
              available={isPaidPlanAvailable("pro", config)}
            />
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Max</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Everything in Pro, unlimited branch locations, and AI Voice Receptionist setup eligibility for larger teams.
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

      {plan === "pro" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-lg font-semibold">Upgrade to Max</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Keep every Pro AI workflow, remove the 3-branch limit, and unlock AI Voice Receptionist setup.
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
