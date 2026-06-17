"use client";

import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingCopy } from "@/lib/i18n";
import { Icon } from "@/components/ui/Icon";

const DEFAULT_TZ = "Asia/Colombo";

export type SlotOption = {
  startUtc: string;
  endUtc: string;
  label: string;
  staffId?: string;
};

type Period = "morning" | "afternoon" | "evening";

function slotPeriod(startUtc: string, timezone: string): Period {
  const hour = toZonedTime(parseISO(startUtc), timezone).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const PERIOD_ORDER: Period[] = ["morning", "afternoon", "evening"];

const PERIOD_LABEL: Record<Period, keyof Pick<BookingCopy, "morning" | "afternoon" | "evening">> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};

export type SlotEmptyState = "none" | "closed" | "full" | "capacity";

interface Props {
  slots: SlotOption[];
  selectedStartUtc: string | null;
  copy: BookingCopy;
  onSelect: (slot: SlotOption) => void;
  loading?: boolean;
  emptyState?: SlotEmptyState;
  timezone?: string;
}

export default function TimeSlotGrid({
  slots,
  selectedStartUtc,
  copy,
  onSelect,
  loading,
  emptyState = "none",
  timezone = DEFAULT_TZ,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    const emptyMessage =
      emptyState === "closed"
        ? copy.dayClosed
        : emptyState === "capacity"
          ? copy.capacityReached
          : emptyState === "full"
            ? copy.dayFull
            : copy.noSlots;
    const emptyIcon =
      emptyState === "closed" ? "calendar-x" : emptyState === "capacity" ? "x-circle" : "calendar-x";

    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 px-4 py-10 text-center">
        <Icon name={emptyIcon} className="mb-2 block text-2xl text-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const grouped = PERIOD_ORDER.map((period) => ({
    period,
    label: copy[PERIOD_LABEL[period]],
    slots: slots.filter((s) => slotPeriod(s.startUtc, timezone) === period),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-5">
      {grouped.map(({ period, label, slots: periodSlots }) => (
        <div key={period}>
          <p className="mb-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {periodSlots.map((slot) => {
              const isSelected = selectedStartUtc === slot.startUtc;
              return (
                <button
                  key={slot.startUtc}
                  type="button"
                  onClick={() => onSelect(slot)}
                  aria-pressed={isSelected}
                  aria-label={`${slot.label}${isSelected ? ", selected" : ""}`}
                  className={`w-full rounded-xl px-2 py-2.5 text-sm font-semibold tabular-nums transition-all ${
                    isSelected
                      ? "booking-bg-accent text-white shadow-md booking-shadow-accent ring-2 booking-ring-accent"
                      : "border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 hover:booking-border-accent hover:booking-bg-accent-muted/50 hover:booking-text-accent"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
