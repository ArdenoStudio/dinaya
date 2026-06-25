"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Props = {
  steps: string[];
  current: number;
  className?: string;
  onStepClick?: (index: number) => void;
};

export function BookingStepIndicator({ steps, current, className, onStepClick }: Props) {
  const activeLabel = steps[current] ?? "";

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-3 text-sm font-medium text-foreground md:hidden" aria-current="step">
        {activeLabel}
      </p>

      <ol className="hidden w-full items-center gap-2 md:flex">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const canNavigate = done && onStepClick;

          const stepContent = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  active && "bg-[var(--booking-accent)] text-white",
                  done && !active && "bg-[var(--booking-accent-muted)] text-[var(--booking-accent)]",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Icon name="check-lg" className="text-xs" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  active && "text-foreground",
                  done && !active && "text-[var(--booking-accent)]",
                  !active && !done && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={label} className={cn("flex items-center", index < steps.length - 1 && "flex-1")}>
              {canNavigate ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className="flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-1 transition-opacity hover:opacity-80"
                >
                  {stepContent}
                </button>
              ) : (
                <div className="flex min-h-11 items-center gap-2 px-1">{stepContent}</div>
              )}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px min-w-4 flex-1",
                    done ? "bg-[var(--booking-accent)]/40" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
