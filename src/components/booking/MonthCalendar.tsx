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
  onSelect: (dateStr: string) => void;
  onMonthChange?: (month: string) => void;
  size?: "compact" | "comfortable";
}

export default function MonthCalendar({
  selectedDate,
  minDate,
  maxDate,
  dayStatus,
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

  return (
    <div
      className={`min-w-0 w-full ${comfortable ? "" : "rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 p-3.5"}`}
    >
      <div className={`flex items-center justify-between ${comfortable ? "mb-4" : "mb-3"}`}>
        <span className={`font-bold text-gray-800 dark:text-gray-200 ${comfortable ? "text-base" : "text-sm"}`}>
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className={`flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-all hover:bg-gray-100 dark:bg-neutral-800 hover:text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-30 ${
              comfortable ? "size-9" : "size-7"
            }`}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" className={comfortable ? "text-sm" : "text-[10px]"} />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className={`flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-all hover:bg-gray-100 dark:bg-neutral-800 hover:text-gray-700 dark:text-gray-300 ${
              comfortable ? "size-9" : "size-7"
            }`}
            aria-label="Next month"
          >
            <Icon name="chevron-right" className={comfortable ? "text-sm" : "text-[10px]"} />
          </button>
        </div>
      </div>
      <div
        className={`grid w-full min-w-0 grid-cols-7 text-center ${comfortable ? "gap-1" : "gap-0.5"}`}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className={`font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 ${comfortable ? "pb-3 text-[11px] tracking-wide" : "pb-1.5 text-[10px] tracking-wide"}`}
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
          const status = dayStatus?.[dateStr];
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(dateStr)}
              className={`relative min-w-0 font-medium transition-all ${
                comfortable
                  ? "mx-auto flex size-10 items-center justify-center rounded-xl text-sm"
                  : "mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg text-xs"
              } ${
                !inMonth
                  ? "pointer-events-none opacity-0"
                  : isSelected
                  ? "booking-bg-accent text-white shadow-md booking-shadow-accent"
                  : disabled
                  ? "cursor-not-allowed text-gray-300"
                  : showToday
                  ? "font-semibold booking-text-accent ring-2 ring-[var(--booking-accent-soft)]"
                  : "text-gray-700 dark:text-gray-300 hover:booking-bg-accent-muted"
              }`}
            >
              {format(day, "d")}
              {inMonth && status === "available" && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full booking-bg-accent"
                />
              )}
              {inMonth && status === "full" && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gray-300"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
