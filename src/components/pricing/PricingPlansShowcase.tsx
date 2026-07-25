"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PricingShowcasePlan } from "@/lib/pricing-page-content";
import { cn } from "@/lib/utils";

type PricingPlansShowcaseProps = {
  plans: PricingShowcasePlan[];
  defaultCtaHref: string;
  defaultCtaLabel: string;
};

function PricingSwitch({
  isYearly,
  onChange,
}: {
  isYearly: boolean;
  onChange: (yearly: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="relative inline-flex rounded-xl border border-border bg-muted/50 p-1 shadow-sm"
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
                  className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 480, damping: 34, bounce: 0 }}
                />
              ) : null}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-opacity duration-200",
          isYearly ? "text-emerald-700 opacity-100 dark:text-emerald-400" : "opacity-0",
        )}
      >
        Save ~17%
      </span>
    </div>
  );
}

function formatPriceParts(amountLkr: number) {
  return {
    whole: Math.floor(amountLkr),
  };
}

export function PricingPlansShowcase({
  plans,
  defaultCtaHref,
  defaultCtaLabel,
}: PricingPlansShowcaseProps) {
  const [isYearly, setIsYearly] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="pricing-showcase-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_-15%,hsl(220_82%_53%/0.14),transparent_55%)] dark:bg-[radial-gradient(100%_70%_at_50%_-15%,hsl(220_82%_53%/0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(220_30%_98%)_0%,transparent_40%,hsl(0_0%_100%)_100%)] dark:bg-[linear-gradient(180deg,hsl(220_20%_8%)_0%,transparent_45%,hsl(0_0%_4%)_100%)]" />
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

        <div className="mt-8 flex justify-center">
          <PricingSwitch isYearly={isYearly} onChange={setIsYearly} />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-6 pb-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5 xl:pb-16 xl:items-stretch">
        {plans.map((plan, index) => {
          const priceLkr =
            plan.monthlyPriceLkr == null
              ? null
              : isYearly
                ? plan.annualPriceLkr
                : plan.monthlyPriceLkr;
          const priceParts = priceLkr == null ? null : formatPriceParts(priceLkr);
          const ctaHref = plan.ctaHref || defaultCtaHref;
          const ctaLabel = plan.ctaLabel || defaultCtaLabel;

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
                "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out",
                plan.popular
                  ? "z-10 border-primary/50 shadow-[0_12px_40px_-16px_hsl(220_82%_53%/0.45)] ring-1 ring-primary/20 xl:-mt-2 xl:mb-2 xl:pb-8"
                  : "border-border hover:border-foreground/15 hover:shadow-md",
              )}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                  Most popular
                </span>
              ) : plan.badge ? (
                <span className="absolute -top-3 left-6 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {plan.badge}
                </span>
              ) : null}

              <div className="text-left">
                <h2 className="font-cal text-2xl tracking-tight">{plan.name}</h2>
                <p className="mt-2 min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground text-pretty">
                  {plan.description}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  {priceParts ? (
                    <>
                      <span className="text-sm font-medium text-muted-foreground">LKR</span>
                      <NumberFlow
                        value={priceParts.whole}
                        className="font-cal text-4xl tracking-tight tabular-nums text-foreground"
                      />
                      <span className="text-sm text-muted-foreground">
                        /{isYearly ? "year" : "mo"}
                      </span>
                    </>
                  ) : (
                    <span className="font-cal text-3xl tracking-tight">From LKR 12,900</span>
                  )}
                </div>

                <div className="mt-1.5 min-h-[1.25rem]">
                  {plan.annualSavingsPercent > 0 && isYearly ? (
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Save {plan.annualSavingsPercent}% vs monthly
                    </p>
                  ) : null}
                </div>
              </div>

              <Link
                href={ctaHref}
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100",
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(37,99,235,0.28)] hover:bg-primary/95"
                    : "border border-border bg-background text-foreground hover:bg-muted/60",
                )}
              >
                {ctaLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <div className="mt-6 flex flex-1 flex-col border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {plan.featureHeading.replace(/:$/, "")}
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <Icon
                        name="check-circle"
                        className={cn(
                          "mt-0.5 shrink-0 text-base",
                          plan.popular ? "text-primary" : "text-foreground/40",
                        )}
                      />
                      <span className="text-pretty">{feature}</span>
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
