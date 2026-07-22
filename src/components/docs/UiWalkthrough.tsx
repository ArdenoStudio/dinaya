"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { GuideStep } from "@content/docs/types";
import { docsSpring } from "@/lib/docs/design-tokens";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { DocsRichText } from "@/lib/docs/rich-text";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsProductFrame } from "./DocsProductFrame";
import { DocsCallout } from "./DocsCallout";
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

function StepVisual({ step }: { step: GuideStep }) {
  if (!step.visual) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gradient-to-b from-gray-50 to-white text-sm text-muted-foreground">
        Follow the steps on the left
      </div>
    );
  }

  if (step.visual.type === "mockup") {
    const screenshot = getScreenshotForMockup(step.visual.mockupId);
    const isBooking = step.visual.mockupId.startsWith("booking-");
    const needsInteractiveHighlight = Boolean(
      step.highlightNav || step.highlightTarget,
    );

    // Guided steps need real DOM marks — use React mockups when highlighting.
    // Clean product shots are for ambient / no-highlight steps only.
    if (screenshot && !needsInteractiveHighlight) {
      if (isBooking) {
        return (
          <DocsPhoneFrame
            src={screenshot}
            alt={`${step.visual.mockupId} screenshot`}
            hotspots={step.hotspots}
          />
        );
      }
      return (
        <DocsProductFrame
          src={screenshot}
          alt={`${step.visual.mockupId} screenshot`}
          hotspots={step.hotspots}
          variant="shot"
        />
      );
    }

    if (isBooking) {
      return (
        <DocsPhoneFrame
          mockupId={step.visual.mockupId}
          highlightTarget={step.highlightTarget}
        />
      );
    }
    return (
      <DocsProductFrame
        mockupId={step.visual.mockupId}
        highlightNav={step.highlightNav}
        highlightTarget={step.highlightTarget}
        variant="browser"
      />
    );
  }

  if (step.visual.type === "screenshot") {
    const isBookingSrc = step.visual.src.includes("booking-");
    if (isBookingSrc) {
      return (
        <DocsPhoneFrame
          src={step.visual.src}
          alt={step.visual.alt}
          hotspots={step.hotspots}
        />
      );
    }
    return (
      <DocsProductFrame
        src={step.visual.src}
        alt={step.visual.alt}
        hotspots={step.hotspots}
        variant="shot"
      />
    );
  }

  return null;
}

function getStepActionHint(step: GuideStep) {
  const targetLabel = step.highlightTarget ? CLICK_TARGET_LABELS[step.highlightTarget] : null;
  const hotspotLabel = step.hotspots?.find((hotspot) => hotspot.label)?.label ?? null;

  if (step.highlightNav && targetLabel) {
    return `Open ${step.highlightNav} in the dashboard side menu, then use the highlighted ${targetLabel}.`;
  }

  if (step.highlightNav) {
    return `Open ${step.highlightNav} in the dashboard side menu. The pointer marks it in the preview.`;
  }

  if (targetLabel) {
    return `Use the highlighted ${targetLabel}.`;
  }

  if (hotspotLabel) {
    return `Use the highlighted ${hotspotLabel}.`;
  }

  return "Read this step first, then continue to the next guided action.";
}

export function UiWalkthrough({ steps }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    <div className="space-y-7">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted-foreground tabular-nums">
            Step {activeStep + 1} of {steps.length}
          </p>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative flex h-10 w-10 items-center justify-center"
              >
                <span
                  className={`block h-1 rounded-full transition-[width,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                    i === activeStep
                      ? "w-5 bg-foreground/70"
                      : "w-1.5 bg-foreground/15 hover:bg-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="h-px overflow-hidden bg-black/[0.06] dark:bg-white/[0.08]">
          <motion.div
            className="h-full bg-foreground/40"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          />
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-1.5" aria-label="Walkthrough step list">
          {steps.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-current={i === activeStep ? "step" : undefined}
              onClick={() => goTo(i)}
              className={`flex h-14 w-[9.5rem] shrink-0 items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:active:scale-100 ${
                i === activeStep
                  ? "bg-foreground/[0.06] dark:bg-white/[0.08]"
                  : "bg-transparent hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ${
                  i === activeStep
                    ? "bg-foreground text-background"
                    : "bg-foreground/[0.08] text-foreground/55 dark:bg-white/10"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-xs font-medium leading-snug line-clamp-2 text-pretty ${
                    i === activeStep
                      ? "text-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  {item.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:items-start lg:gap-10">
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            >
              <h2 className="font-cal text-2xl tracking-tight text-balance text-gray-950 dark:text-white">
                {step.title}
              </h2>
              <DocsRichText
                text={step.body}
                className="mt-3 text-[15px] leading-relaxed text-muted-foreground"
              />
              <DocsCallout variant="tip" className="mt-5">
                {actionHint}
              </DocsCallout>
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-sm font-medium transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] motion-reduce:active:scale-100 disabled:opacity-35 hover:bg-foreground/[0.03] dark:border-white/10 dark:bg-neutral-900/60"
            >
              <Icon name="arrow-left" className="text-xs" />
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(activeStep + 1)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 pr-3 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-primary/90 active:scale-[0.96] motion-reduce:active:scale-100"
              >
                Next
                <Icon name="arrow-right" className="text-xs" />
              </button>
            ) : (
              <a
                href="/docs"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 pr-3 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-primary/90 active:scale-[0.96] motion-reduce:active:scale-100"
              >
                Back to docs
              </a>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-28">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`visual-${activeStep}`}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={docsSpring}
            >
              <StepVisual step={step} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
