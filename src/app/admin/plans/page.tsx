import { AlertTriangle, ShieldCheck } from "lucide-react";
import { count, eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import {
  ENFORCED_FEATURES,
  getPlanConfigAsync,
  type Plan,
  type PlanFeature,
} from "@/lib/plan";
import { formatLkr } from "@/lib/utils";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { resetPlansToDefaults, savePlans } from "./actions";

export const dynamic = "force-dynamic";

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

const FEATURE_ORDER: PlanFeature[] = [
  "publicBookingPage",
  "publicBookingPageCustomization",
  "reviews",
  "reviewReplies",
  "reviewEngine",
  "payments",
  "whatsappSms",
  "smartReminderSystem",
  "automations",
  "aiBookingAutopilot",
  "broadcasts",
  "clientReactivationCampaign",
  "aiUpsellAssistant",
  "aiContentMachine",
  "vipLoyaltySequence",
  "googleCalendarSync",
  "reports",
  "webhooks",
];

function isEnforced(f: PlanFeature): boolean {
  return ENFORCED_FEATURES.includes(f);
}

function limitInputValue(v: number | null): string {
  return v === null ? "" : String(v);
}

export default async function AdminPlansPage() {
  await requirePlatformAdmin();
  const config = await getPlanConfigAsync();

  const [
    [{ freeCount }],
    [{ proCount }],
    [{ maxCount }],
    [{ activeSubCount }],
    [{ activeMrr }],
  ] = await Promise.all([
    db.select({ freeCount: count() }).from(businesses).where(eq(businesses.plan, "free")),
    db.select({ proCount: count() }).from(businesses).where(eq(businesses.plan, "pro")),
    db.select({ maxCount: count() }).from(businesses).where(eq(businesses.plan, "max")),
    db.select({ activeSubCount: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
    db
      .select({ activeMrr: sql<number>`coalesce(sum(${subscriptions.amountLkr}), 0)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
  ]);

  const total = Number(freeCount) + Number(proCount) + Number(maxCount);
  const freeShare = total > 0 ? Math.round((Number(freeCount) / total) * 100) : 0;
  const proShare = total > 0 ? Math.round((Number(proCount) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-cal text-3xl tracking-tight">Plans</h1>
          {config.proLaunched ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700">
              Pro live
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
              Pro in preview (not billed)
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit limits, AI access, features, and paid plan prices. Changes save to{" "}
          <code className="rounded bg-muted px-1 text-xs">.dinaya/plans.json</code>{" "}
          and apply instantly.
        </p>
        {config.updatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last edited {format(new Date(config.updatedAt), "d MMM, h:mm a")}
            {config.updatedBy ? ` by ${config.updatedBy}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-primary" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">Total accounts</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Number(freeCount)} Free · {Number(proCount)} Pro
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-emerald-500" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{Number(activeSubCount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pro & Max · monthly or annual
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-[3px] bg-amber-500" />
          <div className="p-5">
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatLkr(Number(activeMrr))}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pro price: {formatLkr(config.proMonthlyPriceLkr)}/mo
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-50/60 p-4 text-xs text-amber-900">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Heads-up about feature gates</p>
          <p className="mt-1">
            A green &ldquo;Enforced&rdquo; badge means the feature is actually blocked
            in the code for Free users. Features without that badge can be toggled here
            but won&apos;t actually restrict access until a developer wires up the
            gate. Currently enforced: <strong>{ENFORCED_FEATURES.join(", ")}</strong>.
          </p>
        </div>
      </div>

      <form action={savePlans} className="space-y-6">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Pro plan billing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="proMonthlyPriceLkr" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Monthly price (LKR)
              </label>
              <input
                id="proMonthlyPriceLkr"
                name="proMonthlyPriceLkr"
                type="number"
                min={0}
                step={10}
                defaultValue={config.proMonthlyPriceLkr}
                className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="proAnnualPriceLkr" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Annual price (LKR)
              </label>
              <input
                id="proAnnualPriceLkr"
                name="proAnnualPriceLkr"
                type="number"
                min={0}
                step={10}
                defaultValue={config.proAnnualPriceLkr}
                className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Launch status
              </span>
              <label className="mt-1 flex h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="proLaunched"
                  defaultChecked={config.proLaunched}
                  className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
                />
                Pro is live (billed at the price above)
              </label>
              <p className="text-xs text-muted-foreground">
                Unchecked = Pro shown as &ldquo;preview / free until release&rdquo;.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Max plan billing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="maxMonthlyPriceLkr" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Monthly price (LKR)
              </label>
              <input
                id="maxMonthlyPriceLkr"
                name="maxMonthlyPriceLkr"
                type="number"
                min={0}
                step={10}
                defaultValue={config.maxMonthlyPriceLkr}
                className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="maxAnnualPriceLkr" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Annual price (LKR)
              </label>
              <input
                id="maxAnnualPriceLkr"
                name="maxAnnualPriceLkr"
                type="number"
                min={0}
                step={10}
                defaultValue={config.maxAnnualPriceLkr}
                className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Launch status
              </span>
              <label className="mt-1 flex h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="maxLaunched"
                  defaultChecked={config.maxLaunched}
                  className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
                />
                Max is live (billed at the price above)
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
          {(["free", "pro", "max"] as Plan[]).map((planKey) => {
            const entitlements = config.plans[planKey];
            const accent = planKey === "max" ? "border-amber-400/40 ring-1 ring-amber-400/15" : planKey === "pro" ? "border-primary/40 ring-1 ring-primary/15" : "border-muted-foreground/20";
            const tile = planKey === "max" ? "bg-amber-600 text-white" : planKey === "pro" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground";
            const share = planKey === "max"
              ? (total > 0 ? Math.round((Number(maxCount) / total) * 100) : 0)
              : planKey === "pro"
                ? proShare
                : freeShare;
            const countNum = planKey === "max"
              ? Number(maxCount)
              : planKey === "pro"
                ? Number(proCount)
                : Number(freeCount);
            return (
              <fieldset key={planKey} className={`overflow-hidden rounded-2xl border bg-white ${accent}`}>
                <div className="border-b px-6 py-5">
                  <div className="flex items-center justify-between">
                    <legend className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${tile}`}>
                      {planKey === "max" ? "Max" : planKey === "pro" ? "Pro" : "Free"}
                    </legend>
                    <span className="text-xs text-muted-foreground">
                      {countNum} accounts · {share}% of base
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Limits <span className="ml-1 font-normal normal-case text-muted-foreground/70">(blank = unlimited)</span>
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["bookingsPerMonth", "staff", "services", "locations"] as const).map((limitKey) => (
                      <label key={limitKey} className="block">
                        <span className="block text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {limitKey === "bookingsPerMonth" ? "Bookings/mo" : limitKey === "locations" ? "Locations" : limitKey}
                        </span>
                        <input
                          type="text"
                          name={`${planKey}.${limitKey}`}
                          defaultValue={limitInputValue(entitlements.limits[limitKey])}
                          placeholder="Unlimited"
                          className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Features
                  </p>
                  <ul className="space-y-1.5">
                    {FEATURE_ORDER.map((f) => {
                      const on = entitlements.features[f];
                      const enforced = isEnforced(f);
                      return (
                        <li key={f} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              name={`${planKey}.feature.${f}`}
                              defaultChecked={on}
                              className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
                            />
                            <span>{FEATURE_LABELS[f]}</span>
                          </label>
                          <span className="ml-auto flex items-center gap-1.5">
                            {enforced ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-700">
                                <ShieldCheck className="size-3" aria-hidden="true" />
                                Enforced
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                Display only
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </fieldset>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">
            Saves to Postgres (<code className="rounded bg-muted px-1">platform_settings</code>) and
            mirrors to <code className="rounded bg-muted px-1">.dinaya/plans.json</code> for local dev.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save plans
            </button>
          </div>
        </div>
      </form>

      <form action={resetPlansToDefaults}>
        <button
          type="submit"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Reset to defaults
        </button>
      </form>
    </div>
  );
}
