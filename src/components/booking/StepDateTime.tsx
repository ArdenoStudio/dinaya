"use client";

import { useState } from "react";
import { format, addDays, isToday } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Staff } from "@/db/schema";
import type { BookingService } from "./BookingWizard";

const COLOMBO_TZ = "Asia/Colombo";
const DATE_COUNT = 14;

interface SlotData {
  startUtc: string;
  endUtc: string;
  label: string;
}

interface Props {
  businessId: string;
  service: BookingService;
  staff: Staff;
  onSelect: (date: string, slot: { startUtc: string; endUtc: string; label: string }) => void;
  onBack: () => void;
}

export default function StepDateTime({ businessId, service, staff, onSelect, onBack }: Props) {
  const today = toZonedTime(new Date(), COLOMBO_TZ);
  const [selectedDate, setSelectedDate] = useState<string>(format(today, "yyyy-MM-dd"));
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const dates = Array.from({ length: DATE_COUNT }, (_, i) => addDays(today, i));

  async function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setHasFetched(false);
    const res = await fetch(
      `/api/availability?businessId=${businessId}&staffId=${staff.id}&serviceId=${service.id}&date=${date}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
    setHasFetched(true);
  }

  return (
    <div>
      <h2 className="font-cal text-lg mb-4 text-balance">Pick a date & time</h2>

      {/* Date strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {dates.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const isSelected = dateStr === selectedDate;
          const todayDate = isToday(d);
          return (
            <button
              key={dateStr}
              onClick={() => loadSlots(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center rounded-lg px-3 py-2.5 text-xs min-w-[54px] border transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <span className={`font-medium ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {todayDate ? "Today" : format(d, "EEE")}
              </span>
              <span className="font-bold text-base mt-0.5 tabular-nums">{format(d, "d")}</span>
              <span className={`text-[10px] ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                {format(d, "MMM")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {loadingSlots ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !hasFetched ? (
        <p className="text-center text-muted-foreground/60 text-sm py-8">
          Select a date to see available times.
        </p>
      ) : slots.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No slots available on this date. Try another day.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.startUtc === slot.startUtc;
            return (
              <button
                key={slot.startUtc}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg py-2.5 text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                    : "hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="bi bi-chevron-left text-sm" /> Back
        </button>
        {selectedSlot && (
          <button
            onClick={() => onSelect(selectedDate, selectedSlot)}
            className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
