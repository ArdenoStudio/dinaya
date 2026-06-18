"use client";

import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import type { BookingCopy } from "@/lib/i18n";
import type { SlotEmptyState, SlotOption } from "./TimeSlotGrid";

const DEFAULT_TZ = "Asia/Colombo";

type Period = "morning" | "afternoon" | "evening";

function slotPeriod(startUtc: string, timezone: string): Period {
  const hour = toZonedTime(parseISO(startUtc), timezone).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const PERIOD_ORDER: Period[] = ["morning", "afternoon", "evening"];
const PERIOD_LABEL: Record<Period, "morning" | "afternoon" | "evening"> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};

interface SlotListPanelProps {
  slots: SlotOption[];
  selectedStartUtc: string | null;
  copy: BookingCopy;
  onSelect: (slot: SlotOption) => void;
  loading?: boolean;
  emptyState?: SlotEmptyState;
  timezone?: string;
}

export function SlotListPanel({
  slots,
  selectedStartUtc,
  copy,
  onSelect,
  loading = false,
  emptyState = "none",
  timezone = DEFAULT_TZ,
}: SlotListPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    const emptyText =
      emptyState === "closed"
        ? copy.dayClosed
        : emptyState === "capacity"
          ? copy.capacityReached
          : emptyState === "full"
            ? copy.dayFull
            : copy.noSlots;

    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 px-4 py-8 text-center">
        <Icon name="calendar-x" className="text-2xl text-gray-300 dark:text-neutral-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
      </div>
    );
  }

  const byPeriod: Record<Period, SlotOption[]> = { morning: [], afternoon: [], evening: [] };
  for (const slot of slots) {
    byPeriod[slotPeriod(slot.startUtc, timezone)].push(slot);
  }

  return (
    <div className="flex flex-col gap-4">
      {PERIOD_ORDER.map((period) => {
        const periodSlots = byPeriod[period];
        if (periodSlots.length === 0) return null;
        return (
          <div key={period}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {copy[PERIOD_LABEL[period]]}
            </p>
            <div className="flex flex-col gap-1.5">
              {periodSlots.map((slot) => {
                const isSelected = slot.startUtc === selectedStartUtc;
                return (
                  <button
                    key={slot.startUtc}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={slot.label}
                    onClick={() => onSelect(slot)}
                    className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-sm font-medium transition-colors ${
                      isSelected
                        ? "booking-bg-accent border-transparent text-white booking-shadow-accent"
                        : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 hover:border-[var(--booking-accent)] hover:booking-text-accent"
                    }`}
                  >
                    <span>{slot.label}</span>
                    <Icon
                      name={isSelected ? "check" : "chevron-right"}
                      className="text-xs opacity-60"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
