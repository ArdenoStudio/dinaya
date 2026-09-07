"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PricingShowcasePlan } from "@/lib/pricing-page-content";
import { cn } from "@/lib/utils";

function formatLkr(amount: number) {
  return amount.toLocaleString("en-LK");
}

type PlanKey = "starter" | "pro" | "max";
const PLAN_ORDER: PlanKey[] = ["starter", "pro", "max"];

type PricingPlansShowcaseProps = {
  plans: PricingShowcasePlan[];
  defaultCtaHref: string;
  defaultCtaLabel: string;
  /** The signed-in business's active paid plan, if any — drives "Current plan" / "Upgrade" CTAs. */
  currentPlanKey?: PlanKey | null;
};

function PricingSwitch({
  isYearly,
  onChange,
  savingsPercent,
  reduceMotion,
}: {
  isYearly: boolean;
  onChange: (yearly: boolean) => void;
  savingsPercent: number;
  reduceMotion: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative inline-flex rounded-xl border border-border bg-muted/50 p-1 shadow-xs"
        role="group"
        aria-label="Billing period"
      >
        {([false, true] as const).map((yearly) => {
          const active = isYearly === yearly;
          const label = yearly ? "Yearly" : "Monthly";
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(yearly)}
              aria-pressed={active}
              className={cn(
                "relative z-10 min-h-10 rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-150",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="dinaya-pricing-period"
                  className="absolute inset-0 rounded-lg bg-primary shadow-xs"
                  transition={{ type: "spring", stiffness: 480, damping: 34, bounce: 0 }}
                />
              ) : null}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {isYearly && savingsPercent > 0 ? (
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            Save {savingsPercent}%
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PricingPlansShowcase({
  plans,
  defaultCtaHref,
  defaultCtaLabel,
  currentPlanKey,
}: PricingPlansShowcaseProps) {
  const [isYearly, setIsYearly] = useState(false);
  const reduceMotion = useReducedMotion();
  const yearlySavingsPercent = plans.find((p) => p.annualSavingsPercent > 0)?.annualSavingsPercent ?? 0;

  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="pricing-showcase-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_-15%,hsl(220_82%_53%/0.14),transparent_55%)] dark:bg-[radial-gradient(100%_70%_at_50%_-15%,hsl(220_82%_53%/0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(220_30%_98%)_0%,transparent_40%,hsl(0_0%_100%)_100%)] dark:bg-[linear-gradient(180deg,hsl(240_6%_7%)_0%,transparent_45%,hsl(240_6%_7%)_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.28] dark:opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(220 20% 40% / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 40% / 0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 75% 50% at 50% 0%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 75% 50% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-6 public-page-offset-lg pb-10 text-center">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon name="check-circle" className="text-primary text-base" />
          14-day free trial — no card required
        </p>

        <h1
          id="pricing-showcase-heading"
          className="font-cal mt-5 text-4xl tracking-tight text-balance md:text-5xl"
        >
          Simple LKR pricing.
          <br />
          <span className="text-primary">A real booking page included.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
          PayHere-ready checkout, no commission on bookings. Start free — upgrade when appointments stick.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          {[
            { icon: "geo-alt-fill", text: "Built for Sri Lanka" },
            { icon: "currency-dollar", text: "No USD subscriptions" },
            { icon: "percent", text: "Zero commission on bookings" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <Icon name={item.icon} className="text-primary text-xs" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <PricingSwitch
            isYearly={isYearly}
            onChange={setIsYearly}
            savingsPercent={yearlySavingsPercent}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-stretch gap-4 px-6 pb-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5 xl:pb-16">
        {plans.map((plan, index) => {
          const priceLkr =
            plan.monthlyPriceLkr == null
              ? null
              : isYearly
                ? plan.annualPriceLkr
                : plan.monthlyPriceLkr;
          // Always show a /mo figure so Monthly and Yearly stay directly comparable;
          // the true annual charge is called out separately below.
          const displayPriceLkr =
            priceLkr != null && isYearly ? Math.round(priceLkr / 12) : priceLkr;
          const badgeLabel = plan.popular ? "Most popular" : plan.badge;

          const isCurrentPlan = !!currentPlanKey && plan.planKey === currentPlanKey;
          const isUpgradeTarget =
            !!currentPlanKey &&
            !!plan.planKey &&
            PLAN_ORDER.indexOf(plan.planKey) > PLAN_ORDER.indexOf(currentPlanKey);
          const ctaHref = isCurrentPlan || isUpgradeTarget
            ? "/dashboard/billing"
            : plan.ctaHref || defaultCtaHref;
          const ctaLabel = isCurrentPlan
            ? "Current plan"
            : isUpgradeTarget
              ? `Upgrade to ${plan.name}`
              : plan.ctaLabel || defaultCtaLabel;

          return (
            <motion.article
              key={plan.name}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: reduceMotion ? 0 : 0.06 * index,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-card p-6 pt-8 shadow-xs transition-[box-shadow,border-color] duration-200 ease-out",
                plan.popular
                  ? "z-10 border-primary/50 shadow-[0_12px_40px_-16px_hsl(220_82%_53%/0.45)] ring-1 ring-primary/20"
                  : "border-border hover:border-foreground/15 hover:shadow-md",
              )}
            >
              {/* Shared badge row so every card’s content starts on the same line */}
              <div className="absolute inset-x-0 -top-3 flex h-6 justify-center px-6">
                {badgeLabel ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      plan.popular
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border bg-background text-muted-foreground",
                    )}
                  >
                    {badgeLabel}
                  </span>
                ) : null}
              </div>

              <h2 className="font-cal text-2xl tracking-tight">{plan.name}</h2>

              <p className="mt-2 line-clamp-3 min-h-15 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              {/* Fixed price band — keep LKR + amount + period clustered */}
              <div className="mt-5 flex h-14 items-end gap-1">
                <span className="pb-1 text-sm font-medium text-muted-foreground">LKR</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${plan.name}-${displayPriceLkr ?? "custom"}-${isYearly ? "y" : "m"}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                    className="text-4xl font-semibold leading-none tracking-tighter tabular-nums text-foreground"
                  >
                    {displayPriceLkr != null ? formatLkr(displayPriceLkr) : "Custom"}
                  </motion.span>
                </AnimatePresence>
                {priceLkr != null ? (
                  <span className="pb-1 text-sm font-medium text-muted-foreground">/mo</span>
                ) : null}
              </div>

              <div className="mt-1.5 h-5">
                {priceLkr != null && isYearly ? (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      plan.annualSavingsPercent > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    Billed LKR {formatLkr(priceLkr)}/year
                    {plan.annualSavingsPercent > 0 ? ` · Save ${plan.annualSavingsPercent}%` : ""}
                  </p>
                ) : priceLkr == null ? (
                  <p className="text-xs text-muted-foreground">
                    From <span className="font-semibold text-foreground">LKR 13,000</span> · custom setup
                    quote
                  </p>
                ) : null}
              </div>

              <Link
                href={ctaHref}
                className={cn(
                  "mt-5 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100",
                  isCurrentPlan
                    ? "border border-dashed border-border bg-muted/40 text-muted-foreground"
                    : plan.popular
                      ? "bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(37,99,235,0.28)] hover:bg-primary/95"
                      : "border border-border bg-background text-foreground hover:bg-muted/60",
                )}
              >
                {ctaLabel}
                <Icon name={isCurrentPlan ? "check-circle" : "arrow-right"} className="text-sm" />
              </Link>

              <div className="mt-2 h-4">
                {plan.trialNote ? (
                  <p className="text-center text-xs text-muted-foreground">{plan.trialNote}</p>
                ) : null}
              </div>

              <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-border pt-5">
                <p className="mb-3 min-h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {plan.featureHeading.replace(/:$/, "")}
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="grid grid-cols-[1rem_1fr] items-start gap-x-2.5 text-sm text-foreground/85">
                      <Icon
                        name="check-circle"
                        className={cn(
                          "mt-0.5 text-base",
                          plan.popular ? "text-primary" : "text-foreground/40",
                        )}
                      />
                      <span className="leading-snug text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
