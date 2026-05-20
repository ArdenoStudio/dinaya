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
import { useMemo, useState } from "react";

interface Props {
  selectedDate: string;
  minDate: Date;
  maxDate?: Date;
  onSelect: (dateStr: string) => void;
}

export default function MonthCalendar({ selectedDate, minDate, maxDate, onSelect }: Props) {
  const selected = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const [viewMonth, setViewMonth] = useState(() =>
    selected ? startOfMonth(selected) : startOfMonth(minDate)
  );

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

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">{format(viewMonth, "MMMM yyyy")}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-white hover:text-gray-700 hover:shadow-sm"
            aria-label="Previous month"
          >
            <i className="bi bi-chevron-left text-[10px]" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="flex size-7 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-white hover:text-gray-700 hover:shadow-sm"
            aria-label="Next month"
          >
            <i className="bi bi-chevron-right text-[10px]" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="pb-2 text-[9px] font-bold tracking-wider text-gray-400">
            {d}
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
              className={`py-1 text-[11px] font-medium transition-all rounded-lg ${
                !inMonth
                  ? "invisible"
                  : isSelected
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
                  : disabled
                  ? "cursor-not-allowed text-gray-300"
                  : isToday(day)
                  ? "text-blue-600 ring-1 ring-blue-200"
                  : "text-gray-600 hover:bg-white hover:shadow-sm"
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
