"use client";

import { useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Staff } from "@/db/schema";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import MonthCalendar from "./MonthCalendar";

const COLOMBO_TZ = "Asia/Colombo";
const MAX_BOOKING_DAYS = 60;

interface SlotData {
  startUtc: string;
  endUtc: string;
  label: string;
}

interface Props {
  businessId: string;
  copy: BookingCopy;
  service: BookingService | null;
  staff: Staff | null;
  selectedDate: string;
  selectedSlot: SlotData | null;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: SlotData) => void;
  showContinue?: boolean;
  onContinue?: () => void;
  onBack?: () => void;
}

export default function StepDateTime({
  businessId,
  copy,
  service,
  staff,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotSelect,
  showContinue,
  onContinue,
  onBack,
}: Props) {
  const today = toZonedTime(new Date(), COLOMBO_TZ);
  const maxDate = addDays(today, MAX_BOOKING_DAYS);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const canLoad = Boolean(service && staff);

  useEffect(() => {
    if (!canLoad || !selectedDate) {
      setSlots([]);
      setHasFetched(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      setHasFetched(false);
      const res = await fetch(
        `/api/availability?businessId=${businessId}&staffId=${staff!.id}&serviceId=${service!.id}&date=${selectedDate}`
      );
      const data = await res.json();
      if (!cancelled) {
        setSlots(data.slots ?? []);
        setLoadingSlots(false);
        setHasFetched(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId, staff, service, selectedDate, canLoad]);

  const appointmentLabel = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEEE, d MMMM")
    : null;

  if (!service || !staff) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center text-sm text-gray-400">
        {copy.chooseService}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {copy.pickDateTime}
      </p>

      <MonthCalendar
        selectedDate={selectedDate}
        minDate={today}
        maxDate={maxDate}
        onSelect={onDateChange}
      />

      <div className="mt-3">
        {loadingSlots ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : !hasFetched ? (
          <p className="py-6 text-center text-sm text-gray-400">{copy.selectDate}</p>
        ) : slots.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{copy.noSlots}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {slots.map((slot) => {
              const isSelected = selectedSlot?.startUtc === slot.startUtc;
              return (
                <button
                  key={slot.startUtc}
                  type="button"
                  onClick={() => onSlotSelect(slot)}
                  className={`rounded-xl py-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {appointmentLabel && selectedSlot && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs text-emerald-700">
          <i className="bi bi-check-circle mr-1" />
          {appointmentLabel} · {selectedSlot.label}
        </div>
      )}

      {(onBack || showContinue) && (
        <div className="mt-4 flex items-center gap-3 md:hidden">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
            >
              <i className="bi bi-chevron-left text-sm" /> {copy.back}
            </button>
          )}
          {showContinue && selectedSlot && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="ml-auto rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-700"
            >
              {copy.continue}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
