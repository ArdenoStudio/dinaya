"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import type { PricingShowcasePlan } from "@/lib/pricing-page-content";
import { cn } from "@/lib/utils";

type PricingPlansShowcaseProps = {
  plans: PricingShowcasePlan[];
  defaultCtaHref: string;
  defaultCtaLabel: string;
};

const revealVariants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.12,
      duration: 0.5,
    },
  }),
  hidden: {
    filter: "blur(8px)",
    y: -16,
    opacity: 0,
  },
};

function PricingSwitch({ onSwitch }: { onSwitch: (value: string) => void }) {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full border border-white/15 bg-gray-950/80 p-1 backdrop-blur-sm">
        {(["0", "1"] as const).map((value) => {
          const isActive = selected === value;
          const label = value === "0" ? "Monthly" : "Yearly";

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSwitch(value)}
              className={cn(
                "relative z-10 h-10 w-fit rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-6",
                isActive ? "text-white" : "text-gray-300",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="dinaya-pricing-switch"
                  className="absolute inset-0 rounded-full border border-primary/80 bg-gradient-to-t from-primary to-primary/80 shadow-[0_0_24px_rgba(37,99,235,0.45)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatPriceParts(amountLkr: number) {
  return {
    whole: Math.floor(amountLkr),
    hasDecimals: amountLkr % 1 !== 0,
  };
}

export function PricingPlansShowcase({
  plans,
  defaultCtaHref,
  defaultCtaLabel,
}: PricingPlansShowcaseProps) {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const togglePricingPeriod = (value: string) => {
    setIsYearly(Number.parseInt(value, 10) === 1);
  };

  return (
    <section
      ref={pricingRef}
      className="relative mx-auto overflow-x-hidden bg-[#030712] text-white"
      aria-labelledby="pricing-showcase-heading"
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:70px_80px]" />
        <Sparkles
          density={1200}
          direction="bottom"
          speed={0.8}
          color="#93c5fd"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>

      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="pointer-events-none absolute inset-x-0 top-[-7rem] z-0 h-[70vh]"
      >
        <div
          className="absolute inset-x-[-20%] top-0 h-[120%] rounded-full border-[160px] border-primary/30 blur-[92px]"
          aria-hidden
        />
      </TimelineContent>

      <div
        className="pointer-events-none absolute inset-x-[10%] top-0 z-0 h-full opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle at center, hsl(220 82% 53% / 0.55) 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-28 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
          <Icon name="stars" className="text-xs text-primary" />
          14-day free trial — no card required
        </div>

        <h2 id="pricing-showcase-heading" className="font-cal text-4xl tracking-tight text-balance md:text-5xl">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.12}
            staggerFrom="first"
            reverse
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Plans built for Sri Lankan businesses
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="mx-auto mt-4 max-w-2xl text-base text-pretty text-gray-300"
        >
          LKR pricing, PayHere-ready checkout, and a live booking page from day one. Pick monthly or
          annual billing when you are ready to subscribe.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="mt-8"
        >
          <PricingSwitch onSwitch={togglePricingPeriod} />
        </TimelineContent>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-4 px-6 pb-20 md:grid-cols-2 xl:grid-cols-4">
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
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={2 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 text-white",
                  plan.popular &&
                    "z-20 border-primary/40 shadow-[0_-12px_80px_rgba(37,99,235,0.35)]",
                )}
              >
                <CardHeader className="text-left">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-cal text-3xl tracking-tight">{plan.name}</h3>
                    {plan.badge ? (
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-baseline gap-1">
                    {priceParts ? (
                      <>
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">LKR</span>
                        <NumberFlow
                          value={priceParts.whole}
                          className="font-cal text-4xl tracking-tight tabular-nums"
                        />
                        {plan.monthlyPriceLkr != null ? (
                          <span className="ml-1 text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            /{isYearly ? "year" : "month"}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="font-cal text-3xl tracking-tight">From LKR 12,900</span>
                    )}
                  </div>

                  {plan.annualSavingsPercent > 0 && isYearly ? (
                    <p className="mt-1 text-xs font-medium text-emerald-300">
                      Save {plan.annualSavingsPercent}% vs monthly
                    </p>
                  ) : null}

                  <p className="mt-3 min-h-[3.5rem] text-sm leading-relaxed text-pretty text-gray-300">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col pt-0">
                  <Link
                    href={ctaHref}
                    className={cn(
                      "mb-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:active:scale-100",
                      plan.popular
                        ? "border border-primary/60 bg-gradient-to-t from-primary to-primary/85 text-white shadow-lg shadow-primary/30"
                        : "border border-neutral-700 bg-gradient-to-t from-neutral-950 to-neutral-800 text-white shadow-lg shadow-black/30",
                    )}
                  >
                    {ctaLabel}
                    <Icon name="arrow-right" className="text-sm" />
                  </Link>

                  <div className="mt-auto space-y-3 border-t border-neutral-800 pt-4">
                    <h4 className="text-sm font-medium text-gray-200">{plan.featureHeading}</h4>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          );
        })}
      </div>
    </section>
  );
}
