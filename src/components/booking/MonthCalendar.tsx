"use client";

import { Icon } from "@/components/ui/Icon";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";

export type MonthDayStatus = "available" | "full" | "closed";

interface Props {
  selectedDate: string;
  minDate: Date;
  maxDate?: Date;
  dayStatus?: Record<string, MonthDayStatus>;
  personalBusyDates?: Record<string, number>;
  /** Legend label for the personal-conflict corner marker (e.g. copy.calendarConflict). */
  personalBusyLabel?: string;
  nextAvailableDate?: string;
  onSelect: (dateStr: string) => void;
  onMonthChange?: (month: string) => void;
  size?: "compact" | "comfortable";
}

export default function MonthCalendar({
  selectedDate,
  minDate,
  maxDate,
  dayStatus,
  personalBusyDates,
  personalBusyLabel,
  nextAvailableDate,
  onSelect,
  onMonthChange,
  size = "compact",
}: Props) {
  const selected = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const [viewMonth, setViewMonth] = useState(() =>
    selected ? startOfMonth(selected) : startOfMonth(minDate)
  );

  const comfortable = size === "comfortable";

  useEffect(() => {
    if (selectedDate) {
      setViewMonth(startOfMonth(new Date(selectedDate + "T12:00:00")));
    }
  }, [selectedDate]);

  useEffect(() => {
    onMonthChange?.(format(viewMonth, "yyyy-MM"));
  }, [viewMonth, onMonthChange]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  function isDisabled(day: Date) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    if (isBefore(dayStart, min)) return true;
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (dayStart > max) return true;
    }
    return false;
  }

  const canGoPrev = startOfMonth(viewMonth) > startOfMonth(minDate);

  const viewMonthKey = format(viewMonth, "yyyy-MM");
  const hasPersonalBusyInView = Boolean(
    personalBusyLabel &&
      personalBusyDates &&
      Object.keys(personalBusyDates).some(
        (date) => date.startsWith(viewMonthKey) && personalBusyDates[date] > 0,
      ),
  );

  return (
    <div
      className={`min-w-0 w-full ${comfortable ? "py-1" : "rounded-xl border border-border bg-card p-3.5"}`}
    >
      <div className={`flex items-center justify-between ${comfortable ? "mb-4" : "mb-3"}`}>
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
        >
          <Icon name="chevron-left" className={comfortable ? "text-sm" : "text-xs"} />
        </button>
        <span className={`font-semibold text-foreground ${comfortable ? "text-base" : "text-sm"}`}>
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <Icon name="chevron-right" className={comfortable ? "text-sm" : "text-xs"} />
        </button>
      </div>
      <div
        className={`grid w-full min-w-0 grid-cols-7 text-center ${comfortable ? "gap-2" : "gap-0.5"}`}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className={`font-semibold text-muted-foreground ${comfortable ? "pb-3 text-xs tracking-wide" : "pb-1.5 text-[10px] tracking-wide"}`}
          >
            {comfortable ? d : d.slice(0, 3)}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const disabled = !inMonth || isDisabled(day);
          const showToday = isToday(day) && !isSelected && !disabled;
          const isNextAvailable =
            nextAvailableDate === dateStr && !isSelected && !disabled && inMonth;
          const status = dayStatus?.[dateStr];
          const personalBusyCount = personalBusyDates?.[dateStr] ?? 0;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(dateStr)}
              className={`relative min-w-0 overflow-hidden font-medium tabular-nums transition-[background-color,box-shadow,transform] ${
                comfortable
                  ? "mx-auto flex size-12 items-center justify-center rounded-xl text-sm"
                  : "mx-auto flex size-11 min-h-11 min-w-11 max-w-none items-center justify-center rounded-lg text-xs"
              } ${
                !inMonth
                  ? "pointer-events-none opacity-0"
                  : isSelected
                  ? "booking-bg-accent text-white shadow-md booking-shadow-accent"
                  : disabled
                  ? "cursor-not-allowed text-muted-foreground/45"
                  : showToday
                  ? "font-semibold booking-text-accent ring-2 ring-[var(--booking-accent-soft)]"
                  : isNextAvailable
                  ? "font-semibold booking-text-accent ring-2 ring-[var(--booking-accent)] ring-offset-1 ring-offset-background"
                  : "text-foreground hover:booking-bg-accent-muted"
              }`}
            >
              {format(day, "d")}
              {/* Secondary hint: business has open slots. Deliberately faint —
                  it fires on almost every enabled day, so it must read quieter
                  than the personal-conflict marker. */}
              {inMonth && status === "available" && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full booking-bg-accent opacity-40"
                />
              )}
              {inMonth && status === "full" && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-muted-foreground/30"
                />
              )}
              {/* Personal Google Calendar conflict: amber corner fold —
                  a different shape and position from the availability dot so
                  the two systems can't be confused at a glance. */}
              {inMonth && personalBusyCount > 0 && !isSelected && (
                <span
                  aria-hidden="true"
                  title={
                    personalBusyLabel ??
                    `${personalBusyCount} busy calendar period${personalBusyCount === 1 ? "" : "s"}`
                  }
                  className="absolute right-0 top-0 size-0 border-l-[14px] border-t-[14px] border-l-transparent border-t-amber-500 dark:border-t-amber-400"
                />
              )}
            </button>
          );
        })}
      </div>
      {hasPersonalBusyInView && (
        <div className="mt-3 flex items-center gap-2 text-[11px] leading-4 text-muted-foreground">
          <span
            aria-hidden="true"
            className="relative size-3.5 shrink-0 overflow-hidden rounded-[5px] bg-muted ring-1 ring-inset ring-border"
          >
            <span className="absolute right-0 top-0 size-0 border-l-8 border-t-8 border-l-transparent border-t-amber-500 dark:border-t-amber-400" />
          </span>
          <span>{personalBusyLabel}</span>
        </div>
      )}
    </div>
  );
}
