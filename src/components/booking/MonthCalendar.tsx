"use client";

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

interface Props {
  selectedDate: string;
  minDate: Date;
  maxDate?: Date;
  onSelect: (dateStr: string) => void;
  size?: "compact" | "comfortable";
}

export default function MonthCalendar({
  selectedDate,
  minDate,
  maxDate,
  onSelect,
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
    <div className={comfortable ? "" : "rounded-xl border border-gray-100 bg-gray-50/60 p-3.5"}>
      <div className={`flex items-center justify-between ${comfortable ? "mb-4" : "mb-3"}`}>
        <span className={`font-bold text-gray-800 ${comfortable ? "text-base" : "text-sm"}`}>
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className={`flex items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 ${
              comfortable ? "size-9" : "size-7"
            }`}
            aria-label="Previous month"
          >
            <i className={`bi bi-chevron-left ${comfortable ? "text-sm" : "text-[10px]"}`} />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className={`flex items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 ${
              comfortable ? "size-9" : "size-7"
            }`}
            aria-label="Next month"
          >
            <i className={`bi bi-chevron-right ${comfortable ? "text-sm" : "text-[10px]"}`} />
          </button>
        </div>
      </div>
      <div className={`grid grid-cols-7 text-center ${comfortable ? "gap-1" : "gap-y-0.5"}`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className={`font-bold text-gray-400 ${comfortable ? "pb-3 text-[11px] tracking-wide" : "pb-2 text-[9px] tracking-wider"}`}
          >
            {comfortable ? d : d.charAt(0)}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const disabled = !inMonth || isDisabled(day);
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(dateStr)}
              className={`font-medium transition-all ${
                comfortable ? "mx-auto flex size-10 items-center justify-center rounded-xl text-sm" : "rounded-lg py-1 text-[11px]"
              } ${
                !inMonth
                  ? "invisible"
                  : isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : disabled
                  ? "cursor-not-allowed text-gray-300"
                  : isToday(day)
                  ? "text-blue-600 ring-2 ring-blue-200 ring-offset-1"
                  : "text-gray-700 hover:bg-blue-50"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
