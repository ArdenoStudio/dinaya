"use client";

import { useState } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Service, Staff } from "@/db/schema";

const COLOMBO_TZ = "Asia/Colombo";
const DATE_COUNT = 14;

interface SlotData {
  startUtc: string;
  endUtc: string;
  label: string;
}

interface Props {
  businessId: string;
  service: Service;
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

  const dates = Array.from({ length: DATE_COUNT }, (_, i) =>
    addDays(today, i)
  );

  async function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    const res = await fetch(
      `/api/availability?businessId=${businessId}&staffId=${staff.id}&serviceId=${service.id}&date=${date}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">Pick a date & time</h2>

      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {dates.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => loadSlots(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center border rounded-lg px-3 py-2 text-xs min-w-[52px] transition-colors ${
                isSelected ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary"
              }`}
            >
              <span>{format(d, "EEE")}</span>
              <span className="font-bold text-sm mt-0.5">{format(d, "d")}</span>
              <span>{format(d, "MMM")}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {loadingSlots ? (
        <p className="text-center text-muted-foreground text-sm py-8">Loading availability…</p>
      ) : slots.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">
          No slots available on this date. Try another day.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.startUtc === slot.startUtc;
            return (
              <button
                key={slot.startUtc}
                onClick={() => setSelectedSlot(slot)}
                className={`border rounded-md py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:border-primary"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        {selectedSlot && (
          <button
            onClick={() => onSelect(selectedDate, selectedSlot)}
            className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
