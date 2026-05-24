"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GuideStep } from "@content/docs/types";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsScreenshotFrame } from "./DocsScreenshotFrame";
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
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border bg-gray-50 text-sm text-muted-foreground">
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
      <DocsScreenshotFrame
        mockupId={step.visual.mockupId}
        highlightNav={step.highlightNav}
        highlightTarget={step.highlightTarget}
      />
    );
  }

  if (step.visual.type === "screenshot") {
    return (
      <DocsScreenshotFrame
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

  return (
    <div className="space-y-6">
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

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2" aria-label="Walkthrough step list">
          {steps.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-current={i === activeStep ? "step" : undefined}
              onClick={() => goTo(i)}
              className={`flex h-16 w-40 shrink-0 items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                i === activeStep
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-gray-200 bg-white hover:border-primary/30 hover:bg-gray-50"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i === activeStep ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-snug text-gray-900 line-clamp-2">
                  {item.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="font-cal text-xl tracking-tight">{step.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {step.body}
          </p>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-blue-700">
              <Icon name="cursor-fill" className="text-xs" />
              Where to click
            </p>
            <p className="mt-1 text-sm leading-relaxed text-blue-950">{actionHint}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
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
        <div className="lg:sticky lg:top-28">
          <StepVisual step={step} />
        </div>
      </div>
    </div>
  );
}
