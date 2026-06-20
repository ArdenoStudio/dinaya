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
    <div className="-mx-4 flex gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 scrollbar-hide snap-x snap-mandatory">
      {dates.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const isSelected = selectedDate === dateStr;
        if (dateStr < minStr || (maxStr && dateStr > maxStr)) return null;

        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onSelect(dateStr)}
            className={`flex h-12 w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center rounded-xl border px-3 transition-all ${
              isSelected
                ? "booking-border-accent booking-bg-accent text-white shadow-md booking-shadow-accent"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span className={`text-[10px] font-medium ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
              {isToday(d) ? copy.today : format(d, "EEE")}
            </span>
            <span className="mt-0.5 text-base font-semibold tabular-nums">{format(d, "d")}</span>
            <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
              {format(d, "MMM")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
