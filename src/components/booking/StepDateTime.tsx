"use client";

import { useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import type { Staff } from "@/db/schema";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import MonthCalendar from "./MonthCalendar";
import DateQuickStrip from "./DateQuickStrip";
import TimeSlotGrid, { type SlotOption } from "./TimeSlotGrid";

const COLOMBO_TZ = "Asia/Colombo";
const MAX_BOOKING_DAYS = 60;

interface Props {
  businessId: string;
  copy: BookingCopy;
  service: BookingService | null;
  staff: Staff | null;
  selectedDate: string;
  selectedSlot: SlotOption | null;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: SlotOption) => void;
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
  const [slots, setSlots] = useState<SlotOption[]>([]);
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

  const dateHeading = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEEE, d MMMM yyyy")
    : null;

  if (!service || !staff) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-400 md:min-h-[320px]">
        <div>
          <Icon name="calendar2-plus" className="mb-3 block text-3xl text-gray-300" />
          {copy.selectServiceHint}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {copy.pickDateTime}
      </p>

      <div className="flex flex-col gap-4 md:gap-5">
        {/* Date selection */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 md:p-5">
          <p className="mb-3 text-xs font-semibold text-gray-700">{copy.chooseDate}</p>
          <DateQuickStrip
            selectedDate={selectedDate}
            minDate={today}
            maxDate={maxDate}
            copy={copy}
            onSelect={onDateChange}
          />
          <div className="mt-4 hidden md:block">
            <MonthCalendar
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              onSelect={onDateChange}
              size="comfortable"
            />
          </div>
          <div className="mt-3 md:hidden">
            <MonthCalendar
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              onSelect={onDateChange}
              size="compact"
            />
          </div>
        </section>

        {/* Time selection */}
        <section className="rounded-xl border border-gray-100 bg-white p-4 md:p-5">
          {dateHeading ? (
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900">{dateHeading}</h3>
              <span className="text-xs text-gray-400">{copy.availableTimes}</span>
            </div>
          ) : (
            <p className="mb-3 text-xs text-gray-400">{copy.selectDate}</p>
          )}

          {!hasFetched && !loadingSlots ? (
            <p className="py-6 text-center text-sm text-gray-400">{copy.selectDate}</p>
          ) : (
            <TimeSlotGrid
              slots={slots}
              selectedStartUtc={selectedSlot?.startUtc ?? null}
              copy={copy}
              onSelect={onSlotSelect}
              loading={loadingSlots}
            />
          )}
        </section>
      </div>

      {dateHeading && selectedSlot && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-sm text-emerald-800 md:hidden">
          <Icon name="check-circle" className="mr-1.5" />
          <span className="font-medium">{selectedSlot.label}</span>
          <span className="text-emerald-600"> · {dateHeading}</span>
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
              <Icon name="chevron-left" className="text-sm" /> {copy.back}
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
