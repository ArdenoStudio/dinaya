import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { planDisplayName, type Plan } from "@/lib/plan";
import { UpgradeButton } from "./UpgradeButton";
import { CancelButton } from "./CancelButton";

const PRO_PRICE_LKR = Number(process.env.DINAYA_PRO_MONTHLY_PRICE_LKR ?? "2500");
const MAX_PRICE_LKR = Number(process.env.DINAYA_MAX_MONTHLY_PRICE_LKR ?? "3990");

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const businessId = (session.user as { businessId: string }).businessId;

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
              Unlimited bookings, staff, and services — plus multi-staff calendar, custom
              domain, branding control, advanced reports, and priority WhatsApp support.
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                Rs {PRO_PRICE_LKR.toLocaleString("en-LK")}
              </span>
              <span className="text-sm text-neutral-500">/ month</span>
            </div>
            <div className="mt-5">
              <UpgradeButton targetPlan="pro" />
            </div>
          </section>

          <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
            <h2 className="text-lg font-semibold">Upgrade to Max</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Everything in Pro — plus AI Booking Autopilot, Smart reminders, Review engine,
              Client reactivation, AI upsell assistant, 30-Day Content Machine, and VIP
              Loyalty Sequence.
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                Rs {MAX_PRICE_LKR.toLocaleString("en-LK")}
              </span>
              <span className="text-sm text-neutral-500">/ month</span>
            </div>
            <div className="mt-5">
              <UpgradeButton targetPlan="max" />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Billed monthly. Cancel anytime — you keep your plan until the period ends.
            </p>
          </section>
        </>
      )}

      {plan === "pro" && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
          <h2 className="text-lg font-semibold">Upgrade to Max</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Unlock AI Booking Autopilot, Smart reminders, Review engine, Client reactivation,
            AI upsell assistant, 30-Day Content Machine, and VIP Loyalty Sequence.
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              Rs {MAX_PRICE_LKR.toLocaleString("en-LK")}
            </span>
            <span className="text-sm text-neutral-500">/ month</span>
          </div>
          <div className="mt-5">
            <UpgradeButton targetPlan="max" />
          </div>
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
