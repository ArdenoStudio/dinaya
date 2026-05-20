"use client";

import { addDays, format, isToday } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingCopy } from "@/lib/i18n";

const COLOMBO_TZ = "Asia/Colombo";
const DAY_COUNT = 14;

interface Props {
  selectedDate: string;
  minDate: Date;
  maxDate?: Date;
  copy: BookingCopy;
  onSelect: (dateStr: string) => void;
}

export default function DateQuickStrip({ selectedDate, minDate, maxDate, copy, onSelect }: Props) {
  const today = toZonedTime(new Date(), COLOMBO_TZ);
  const dates = Array.from({ length: DAY_COUNT }, (_, i) => addDays(today, i));
  const minStr = format(minDate, "yyyy-MM-dd");
  const maxStr = maxDate ? format(maxDate, "yyyy-MM-dd") : null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:hidden">
      {dates.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const isSelected = selectedDate === dateStr;
        if (dateStr < minStr || (maxStr && dateStr > maxStr)) return null;

        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onSelect(dateStr)}
            className={`flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2.5 transition-all ${
              isSelected
                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <span className={`text-[10px] font-medium ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
              {isToday(d) ? copy.today : format(d, "EEE")}
            </span>
            <span className="mt-0.5 text-base font-bold tabular-nums">{format(d, "d")}</span>
            <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
              {format(d, "MMM")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
