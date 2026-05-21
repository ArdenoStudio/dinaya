import Link from "next/link";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/auth";
import {
  annualSavingsPercent,
  getPlanConfig,
  planDisplayName,
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
}: {
  monthlyLkr: number;
  annualLkr: number;
  targetPlan: "pro" | "max";
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
      <div className="mt-5 flex flex-wrap gap-3">
        <UpgradeButton targetPlan={targetPlan} interval="monthly" />
        <UpgradeButton
          targetPlan={targetPlan}
          interval="annual"
          variant="secondary"
          label={savings > 0 ? `Annual · save ${savings}%` : "Annual"}
        />
      </div>
    </>
  );
}

export default async function BillingPage() {
  const { businessId } = await requireOwner();
  const {
    proMonthlyPriceLkr,
    proAnnualPriceLkr,
    maxMonthlyPriceLkr,
    maxAnnualPriceLkr,
  } = getPlanConfig();

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
      inArray(subscriptions.status, ["active", "past_due"]),
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const plan = (business?.plan ?? "free") as Plan;
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
                Billed {activeSub.billingInterval === "annual" ? "annually" : "monthly"}
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
            />
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Max</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Everything in Pro, with unlimited branch locations for larger teams.
            </p>
            <PlanPricing
              monthlyLkr={maxMonthlyPriceLkr}
              annualLkr={maxAnnualPriceLkr}
              targetPlan="max"
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
            Keep every Pro AI workflow and remove the 3-branch limit.
          </p>
          <PlanPricing
            monthlyLkr={maxMonthlyPriceLkr}
            annualLkr={maxAnnualPriceLkr}
            targetPlan="max"
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
