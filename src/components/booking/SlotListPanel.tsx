"use client";

import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import type { BookingCopy } from "@/lib/i18n";
import { SlotListPanelSkeleton } from "./SlotListPanelSkeleton";
import {
  slotConflictsWithBusyTime,
  type CalendarBusyTime,
} from "@/lib/google-calendar-overlay";
import type { SlotEmptyState, SlotOption } from "./TimeSlotGrid";
import { SlotsEmptyView, type NextAvailableSlot } from "./SlotsEmptyView";

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
  refreshing?: boolean;
  emptyState?: SlotEmptyState;
  timezone?: string;
  busyTimes?: CalendarBusyTime[];
  nextAvailable?: NextAvailableSlot | null;
  onNextAvailable?: (slot: NextAvailableSlot) => void;
}

export function SlotListPanel({
  slots,
  selectedStartUtc,
  copy,
  onSelect,
  loading = false,
  refreshing = false,
  emptyState = "none",
  timezone = DEFAULT_TZ,
  busyTimes = [],
  nextAvailable,
  onNextAvailable,
}: SlotListPanelProps) {
  if (loading) {
    return <SlotListPanelSkeleton label={copy.loadingAvailableTimes} />;
  }

  if (slots.length === 0) {
    return (
      <SlotsEmptyView
        copy={copy}
        emptyState={emptyState}
        nextAvailable={nextAvailable}
        onNextAvailable={onNextAvailable}
        variant="list"
      />
    );
  }

  const byPeriod: Record<Period, SlotOption[]> = { morning: [], afternoon: [], evening: [] };
  for (const slot of slots) {
    byPeriod[slotPeriod(slot.startUtc, timezone)].push(slot);
  }

  return (
    <div
      className={`relative flex flex-col gap-4 transition-opacity ${refreshing ? "pointer-events-none opacity-50" : ""}`}
      aria-busy={refreshing || undefined}
    >
      {PERIOD_ORDER.map((period) => {
        const periodSlots = byPeriod[period];
        if (periodSlots.length === 0) return null;
        return (
          <div key={period}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy[PERIOD_LABEL[period]]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {periodSlots.map((slot) => {
                const isSelected = slot.startUtc === selectedStartUtc;
                const hasCalendarConflict = slotConflictsWithBusyTime(slot, busyTimes);
                return (
                  <button
                    key={slot.startUtc}
                    type="button"
                    disabled={hasCalendarConflict}
                    aria-pressed={isSelected}
                    aria-label={`${slot.label}${
                      hasCalendarConflict ? `, ${copy.calendarConflict}` : ""
                    }`}
                    onClick={() => onSelect(slot)}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors ${
                      hasCalendarConflict
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                        : isSelected
                        ? "booking-bg-accent border-transparent text-white booking-shadow-accent"
                        : "border-border bg-card text-foreground hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent-muted)]/30"
                    }`}
                  >
                    {!hasCalendarConflict && !isSelected && (
                      <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 text-left">
                      <span className={hasCalendarConflict ? "line-through decoration-gray-300" : ""}>
                        {slot.label}
                      </span>
                      {hasCalendarConflict && (
                        <span className="mt-0.5 block text-[10px] font-normal no-underline">
                          {copy.calendarConflict}
                        </span>
                      )}
                    </span>
                    {isSelected && !hasCalendarConflict && (
                      <Icon name="check" className="shrink-0 text-xs opacity-90" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent"
        aria-hidden
      />
    </div>
  );
}
