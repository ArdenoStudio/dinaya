"use client";

import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingCopy } from "@/lib/i18n";
import { TimeSlotGridSkeleton } from "./SlotListPanelSkeleton";
import { SlotsEmptyView, type NextAvailableSlot } from "./SlotsEmptyView";
import {
  slotConflictsWithBusyTime,
  type CalendarBusyTime,
} from "@/lib/google-calendar-overlay";

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
  refreshing?: boolean;
  emptyState?: SlotEmptyState;
  timezone?: string;
  busyTimes?: CalendarBusyTime[];
  nextAvailable?: NextAvailableSlot | null;
  onNextAvailable?: (slot: NextAvailableSlot) => void;
}

export default function TimeSlotGrid({
  slots,
  selectedStartUtc,
  copy,
  onSelect,
  loading,
  refreshing = false,
  emptyState = "none",
  timezone = DEFAULT_TZ,
  busyTimes = [],
  nextAvailable,
  onNextAvailable,
}: Props) {
  if (loading) {
    return <TimeSlotGridSkeleton label={copy.loadingAvailableTimes} />;
  }

  if (slots.length === 0) {
    return (
      <SlotsEmptyView
        copy={copy}
        emptyState={emptyState}
        nextAvailable={nextAvailable}
        onNextAvailable={onNextAvailable}
        variant="grid"
      />
    );
  }

  const grouped = PERIOD_ORDER.map((period) => ({
    period,
    label: copy[PERIOD_LABEL[period]],
    slots: slots.filter((s) => slotPeriod(s.startUtc, timezone) === period),
  })).filter((g) => g.slots.length > 0);

  return (
    <div
      className={`space-y-5 transition-opacity ${refreshing ? "pointer-events-none opacity-50" : ""}`}
      aria-busy={refreshing || undefined}
    >
      {grouped.map(({ period, label, slots: periodSlots }) => (
        <div key={period}>
          <p className="mb-2.5 text-xs font-semibold text-muted-foreground">{label}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {periodSlots.map((slot) => {
              const isSelected = selectedStartUtc === slot.startUtc;
              const hasCalendarConflict = slotConflictsWithBusyTime(slot, busyTimes);
              return (
                <button
                  key={slot.startUtc}
                  type="button"
                  disabled={hasCalendarConflict}
                  onClick={() => onSelect(slot)}
                  aria-pressed={isSelected}
                  aria-label={`${slot.label}${isSelected ? ", selected" : ""}${
                    hasCalendarConflict ? `, ${copy.calendarConflict}` : ""
                  }`}
                  className={`w-full rounded-lg px-2 py-2.5 text-sm font-semibold tabular-nums transition-all ${
                    hasCalendarConflict
                      ? "cursor-not-allowed border border-border bg-muted text-muted-foreground line-through"
                      : isSelected
                      ? "bg-[var(--booking-accent)] text-white shadow-sm ring-2 ring-[var(--booking-accent-soft)]"
                      : "border border-border bg-card text-foreground hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent-muted)]/40"
                  }`}
                  title={hasCalendarConflict ? copy.calendarConflict : undefined}
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
