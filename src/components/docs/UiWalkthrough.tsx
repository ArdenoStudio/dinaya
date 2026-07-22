"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { GuideStep } from "@content/docs/types";
import { docsEase } from "@/lib/docs/design-tokens";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { DocsRichText } from "@/lib/docs/rich-text";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsProductFrame } from "./DocsProductFrame";
import { Icon } from "@/components/ui/Icon";

type Props = {
  steps: GuideStep[];
  guideSlug?: string;
};

type HighlightTarget = NonNullable<GuideStep["highlightTarget"]>;

const CLICK_TARGET_LABELS = {
  "onboarding-business-info": "Business info row",
  "marketing-booking-link": "booking link field",
  "marketing-copy-link": "Copy link button",
  "marketing-qr-code": "QR code button",
  "marketing-whatsapp": "WhatsApp share button",
  "marketing-directory": "directory listing switch",
  "marketing-embed": "embed widget option",
  "availability-weekly-hours": "Weekly hours panel",
  "availability-blocked-dates": "Blocked dates panel",
  "services-add-service": "Add service button",
  "services-row": "service row",
  "bookings-new-booking": "New booking button",
  "bookings-row": "booking row",
  "bookings-reschedule": "Reschedule action",
  "bookings-cancel": "Cancel action",
  "bookings-refund": "Refund action",
  "billing-upgrade": "Upgrade button",
  "integrations-connect": "Connect button",
  "deals-new-deal": "New deal button",
  "deals-row": "deal row",
  "booking-service-card": "service card",
  "booking-time-slot": "time slot",
  "booking-confirm-pay": "Confirm & Pay button",
  "booking-stars": "star rating",
  "booking-reschedule": "Reschedule button",
  "booking-cancel": "Cancel button",
} satisfies Record<HighlightTarget, string>;

function resolveStepSrc(step: GuideStep): string | undefined {
  if (!step.visual) return undefined;
  if (step.visual.type === "screenshot") return step.visual.src;
  if (step.visual.type === "mockup") return getScreenshotForMockup(step.visual.mockupId);
  return undefined;
}

function StepVisual({ step }: { step: GuideStep }) {
  const src = resolveStepSrc(step);
  if (!src) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-[hsl(240_6%_96%)] text-sm text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-[hsl(240_5%_10%)]">
        Follow the steps on the left
      </div>
    );
  }

  const isBooking =
    src.includes("booking-") ||
    (step.visual?.type === "mockup" && step.visual.mockupId.startsWith("booking-"));

  if (isBooking) {
    return (
      <DocsPhoneFrame
        src={src}
        alt={step.title}
        highlightTarget={step.highlightTarget}
        hotspots={step.hotspots}
        staged
        scale={0.8}
      />
    );
  }

  return (
    <DocsProductFrame
      src={src}
      alt={step.title}
      highlightNav={step.highlightNav}
      highlightTarget={step.highlightTarget}
      hotspots={step.hotspots}
      staged
    />
  );
}

function getStepActionHint(step: GuideStep) {
  const targetLabel = step.highlightTarget ? CLICK_TARGET_LABELS[step.highlightTarget] : null;

  if (step.highlightNav && targetLabel) {
    return `Open ${step.highlightNav} in the side menu, then use the highlighted ${targetLabel}.`;
  }
  if (step.highlightNav) {
    return `Open ${step.highlightNav} in the dashboard side menu — marked in the preview.`;
  }
  if (targetLabel) {
    return `Use the highlighted ${targetLabel}.`;
  }
  return null;
}

export function UiWalkthrough({ steps }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const initial = Math.min(
    Math.max(0, parseInt(searchParams.get("step") ?? "0", 10) || 0),
    steps.length - 1,
  );
  const [activeStep, setActiveStep] = useState(initial);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, steps.length - 1));
      setActiveStep(next);
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(next));
      router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
    },
    [router, steps.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(activeStep + 1);
      if (e.key === "ArrowLeft") goTo(activeStep - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeStep, goTo]);

  const step = steps[activeStep];
  const actionHint = getStepActionHint(step);
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-8">
      {/* Single quiet progress model */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted-foreground tabular-nums">
          Step {activeStep + 1} of {steps.length}
        </p>
        <div className="h-px max-w-[12rem] flex-1 overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
          <motion.div
            className="h-full bg-foreground/45"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: docsEase }}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.45fr)] lg:items-start lg:gap-10">
        {/* Copy + step list */}
        <div className="order-2 space-y-6 lg:order-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: docsEase }}
            >
              <h2 className="font-cal text-2xl tracking-tight text-balance text-foreground">
                {step.title}
              </h2>
              <DocsRichText
                text={step.body}
                className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty"
              />
              {actionHint ? (
                <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                  <span className="font-medium text-foreground">Look for: </span>
                  {actionHint}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* Vertical step list — desktop; horizontal compact on mobile */}
          <ol className="hidden space-y-1 lg:block" aria-label="Walkthrough steps">
            {steps.map((item, i) => {
              const done = i < activeStep;
              const current = i === activeStep;
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    aria-current={current ? "step" : undefined}
                    onClick={() => goTo(i)}
                    className={`flex w-full min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.98] motion-reduce:active:scale-100 ${
                      current
                        ? "bg-foreground/[0.06] text-foreground dark:bg-white/[0.08]"
                        : "text-foreground/55 hover:bg-foreground/[0.03] hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                        current
                          ? "bg-foreground text-background"
                          : done
                            ? "bg-foreground/15 text-foreground/70"
                            : "bg-foreground/[0.06] text-foreground/45"
                      }`}
                    >
                      {done && !current ? (
                        <Icon name="check" className="text-[10px]" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0 text-sm font-medium leading-snug line-clamp-2 text-pretty">
                      {item.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:hidden">
            <div className="flex min-w-max gap-1.5" aria-label="Walkthrough steps">
              {steps.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  aria-current={i === activeStep ? "step" : undefined}
                  onClick={() => goTo(i)}
                  className={`flex h-12 min-w-[2.75rem] shrink-0 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] ${
                    i === activeStep
                      ? "bg-foreground text-background"
                      : "bg-foreground/[0.06] text-foreground/60"
                  }`}
                >
                  <span className="tabular-nums">{i + 1}</span>
                  {i === activeStep ? (
                    <span className="max-w-[8rem] truncate">{item.title}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:active:scale-100 disabled:opacity-35 hover:bg-foreground/[0.03] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              <Icon name="arrow-left" className="text-xs" />
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(activeStep + 1)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 pr-3 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-primary/90 active:scale-[0.96] motion-reduce:active:scale-100"
              >
                Next
                <Icon name="arrow-right" className="text-xs" />
              </button>
            ) : (
              <a
                href="/docs"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 pr-3 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-primary/90 active:scale-[0.96] motion-reduce:active:scale-100"
              >
                Back to docs
              </a>
            )}
          </div>
        </div>

        {/* Visual stage */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-28">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`visual-${activeStep}`}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.28, ease: docsEase }}
            >
              <StepVisual step={step} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
