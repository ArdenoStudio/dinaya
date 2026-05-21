"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GuideStep } from "@content/docs/types";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsScreenshotFrame } from "./DocsScreenshotFrame";

type Props = {
  steps: GuideStep[];
  guideSlug?: string;
};

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

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="font-cal text-xl tracking-tight">{step.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {step.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => goTo(activeStep - 1)}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
            >
              <i className="bi bi-arrow-left text-xs" />
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(activeStep + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Next
                <i className="bi bi-arrow-right text-xs" />
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
