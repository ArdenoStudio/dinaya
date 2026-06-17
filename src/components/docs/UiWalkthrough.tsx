"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { GuideStep } from "@content/docs/types";
import { docsSpring } from "@/lib/docs/design-tokens";
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
    if (step.visual.mockupId.startsWith("booking-")) {
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
      />
    );
  }

  if (step.visual.type === "screenshot") {
    return (
      <DocsProductFrame
        src={step.visual.src}
        alt={step.visual.alt}
        hotspots={step.hotspots}
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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {activeStep + 1} of {steps.length}
          </p>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeStep ? "w-6 bg-primary" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={docsSpring}
          />
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2" aria-label="Walkthrough step list">
          {steps.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-current={i === activeStep ? "step" : undefined}
              onClick={() => goTo(i)}
              className={`flex h-16 w-40 shrink-0 items-start gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                i === activeStep
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-gray-200 dark:border-neutral-800 bg-white shadow-sm shadow-gray-900/5 dark:shadow-black/20 hover:border-primary/30 hover:bg-gray-50 dark:bg-neutral-900/60"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i === activeStep ? "bg-primary text-white" : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                  {item.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-sm shadow-gray-900/5 dark:shadow-black/20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <h2 className="font-cal text-xl tracking-tight text-gray-950">{step.title}</h2>
              <DocsRichText
                text={step.body}
                className="mt-3 text-sm leading-relaxed text-muted-foreground"
              />
              <DocsCallout variant="tip" className="mt-4">
                {actionHint}
              </DocsCallout>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:bg-neutral-900/60"
            >
              <Icon name="arrow-left" className="text-xs" />
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(activeStep + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Next
                <Icon name="arrow-right" className="text-xs" />
              </button>
            ) : (
              <a
                href="/docs"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Back to docs
              </a>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-28">
          <AnimatePresence mode="wait">
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
