"use client";

import { format, parseISO } from "date-fns";
import type { BookingCopy } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";
import type { SlotEmptyState } from "./TimeSlotGrid";

export type NextAvailableSlot = {
  date: string;
  startUtc: string;
  endUtc: string;
  label: string;
};

interface SlotsEmptyViewProps {
  copy: BookingCopy;
  emptyState: SlotEmptyState;
  nextAvailable?: NextAvailableSlot | null;
  onNextAvailable?: (slot: NextAvailableSlot) => void;
  variant?: "list" | "grid";
}

function emptyMessage(copy: BookingCopy, emptyState: SlotEmptyState) {
  if (emptyState === "closed") return copy.dayClosed;
  if (emptyState === "capacity") return copy.capacityReached;
  if (emptyState === "full") return copy.dayFull;
  return copy.noSlots;
}

function emptyIcon(emptyState: SlotEmptyState) {
  if (emptyState === "capacity") return "x-circle" as const;
  return "calendar-x" as const;
}

export function SlotsEmptyView({
  copy,
  emptyState,
  nextAvailable,
  onNextAvailable,
  variant = "list",
}: SlotsEmptyViewProps) {
  const message = emptyMessage(copy, emptyState);
  const showNext =
    nextAvailable && onNextAvailable && emptyState !== "none";
  const nextLabel = showNext
    ? `${format(parseISO(nextAvailable.date + "T12:00:00"), "EEE d MMM")} · ${nextAvailable.label}`
    : null;

  if (variant === "grid") {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
        <Icon name={emptyIcon(emptyState)} className="mb-2 block text-2xl text-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        {showNext && nextLabel && (
          <button
            type="button"
            onClick={() => onNextAvailable(nextAvailable)}
            className="mt-4 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-lg bg-[var(--booking-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--booking-accent)]/90"
            aria-label={`${copy.nextAvailable}: ${nextLabel}`}
          >
            {nextLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 px-3 py-8 text-center">
      <Icon name={emptyIcon(emptyState)} className="text-xl text-muted-foreground/50" />
      <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
      {showNext && nextLabel && (
        <button
          type="button"
          onClick={() => onNextAvailable(nextAvailable)}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--booking-accent)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--booking-accent)]/90"
          aria-label={`${copy.nextAvailable}: ${nextLabel}`}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
