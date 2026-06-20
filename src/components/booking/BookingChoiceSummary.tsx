"use client";

import { cn } from "@/lib/utils";

type Props = {
  serviceName?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  stepLabel?: string | null;
  className?: string;
};

export function BookingChoiceSummary({
  serviceName,
  dateLabel,
  timeLabel,
  stepLabel,
  className,
}: Props) {
  const parts = [serviceName, dateLabel, timeLabel].filter(Boolean);
  const text = parts.length > 0 ? parts.join(" · ") : stepLabel;

  if (!text) return null;

  return (
    <p
      className={cn("truncate text-sm font-medium text-foreground", className)}
      title={text}
      aria-live="polite"
    >
      {text}
    </p>
  );
}
