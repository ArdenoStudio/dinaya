"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import type { Staff } from "@/db/schema";
import { getBookingSessionToken } from "@/lib/booking-session";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import MonthCalendar, { type MonthDayStatus } from "./MonthCalendar";
import DateQuickStrip from "./DateQuickStrip";
import TimeSlotGrid, { type SlotEmptyState, type SlotOption } from "./TimeSlotGrid";

import { ANY_STAFF_ID } from "@/lib/booking-staff";

const DEFAULT_TZ = "Asia/Colombo";
const POLL_MS = 60_000;

type NextSlot = {
  date: string;
  startUtc: string;
  endUtc: string;
  label: string;
};

interface Props {
  businessId: string;
  copy: BookingCopy;
  service: BookingService | null;
  staff: Staff | null;
  selectedDate: string;
  selectedSlot: SlotOption | null;
  dealId?: string | null;
  locationId?: string | null;
  anyStaff?: boolean;
  timezone?: string;
  holdLabel?: string | null;
  slotUnavailable?: boolean;
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
  dealId,
  locationId,
  anyStaff,
  timezone = DEFAULT_TZ,
  holdLabel,
  slotUnavailable,
  onDateChange,
  onSlotSelect,
  showContinue,
  onContinue,
  onBack,
}: Props) {
  const today = toZonedTime(new Date(), timezone);
  const maxDate = service?.maximumAdvanceDays
    ? addDays(today, service.maximumAdvanceDays)
    : undefined;
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [slotEmptyState, setSlotEmptyState] = useState<SlotEmptyState>("none");
  const [nextAvailable, setNextAvailable] = useState<NextSlot | null>(null);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [monthDayStatus, setMonthDayStatus] = useState<Record<string, MonthDayStatus>>({});
  const [calendarMonth, setCalendarMonth] = useState(() => format(today, "yyyy-MM"));

  const canLoad = Boolean(service && (staff || anyStaff));
  const sessionToken = typeof window !== "undefined" ? getBookingSessionToken() : "";

  async function loadSlots(date: string) {
    if (!service || (!staff && !anyStaff)) return;
    setLoadingSlots(true);
    setHasFetched(false);
    const query = new URLSearchParams({
      businessId,
      staffId: anyStaff ? ANY_STAFF_ID : staff!.id,
      serviceId: service.id,
      date,
    });
    if (locationId) query.set("locationId", locationId);
    if (dealId) query.set("dealId", dealId);
    if (sessionToken) query.set("sessionToken", sessionToken);
    const res = await fetch(`/api/availability?${query.toString()}`);
    const data = await res.json();
    setSlots(data.slots ?? []);
    if (data.closed) {
      setSlotEmptyState("closed");
    } else if (data.capacityReached) {
      setSlotEmptyState("capacity");
    } else if ((data.slots ?? []).length === 0) {
      setSlotEmptyState("full");
    } else {
      setSlotEmptyState("none");
    }
    setLoadingSlots(false);
    setHasFetched(true);
  }

  const loadMonthStatus = useCallback(
    async (month: string) => {
      if (!service || (!staff && !anyStaff)) return;
      const query = new URLSearchParams({
        businessId,
        staffId: anyStaff ? ANY_STAFF_ID : staff!.id,
        serviceId: service.id,
        month,
      });
      if (locationId) query.set("locationId", locationId);
      if (dealId) query.set("dealId", dealId);
      if (sessionToken) query.set("sessionToken", sessionToken);
      const res = await fetch(`/api/availability/month?${query.toString()}`);
      const data = await res.json();
      setMonthDayStatus((prev) => ({ ...prev, ...(data.days ?? {}) }));
    },
    [businessId, dealId, locationId, anyStaff, service, sessionToken, staff],
  );

  useEffect(() => {
    if (!canLoad || !selectedDate) {
      setSlots([]);
      setHasFetched(false);
      return;
    }

    let cancelled = false;
    (async () => {
      await loadSlots(selectedDate);
      if (cancelled) return;
    })();

    const interval = setInterval(() => {
      if (!cancelled) void loadSlots(selectedDate);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, staff?.id, service?.id, selectedDate, canLoad, dealId]);

  useEffect(() => {
    if (!canLoad) {
      setNextAvailable(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const query = new URLSearchParams({
        businessId,
        staffId: anyStaff ? ANY_STAFF_ID : staff!.id,
        serviceId: service!.id,
      });
      if (locationId) query.set("locationId", locationId);
      if (sessionToken) query.set("sessionToken", sessionToken);
      const res = await fetch(`/api/availability/next?${query.toString()}`);
      const data = await res.json();
      if (!cancelled) setNextAvailable(data.next ?? null);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, staff?.id, service?.id, canLoad]);

  useEffect(() => {
    if (!canLoad) {
      setMonthDayStatus({});
      return;
    }
    void loadMonthStatus(calendarMonth);
  }, [calendarMonth, canLoad, loadMonthStatus]);

  const handleMonthChange = useCallback((month: string) => {
    setCalendarMonth(month);
  }, []);

  const dateHeading = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEEE, d MMMM yyyy")
    : null;

  if (!service || (!staff && !anyStaff)) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500 md:min-h-[320px]">
        <div>
          <Icon name="calendar2-plus" className="mb-3 block text-3xl text-gray-300 dark:text-neutral-600" />
          {copy.selectServiceHint}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
        {copy.pickDateTime}
      </p>

      {nextAvailable && nextAvailable.date !== selectedDate && (
        <button
          type="button"
          onClick={() => {
            onDateChange(nextAvailable.date);
            onSlotSelect({
              startUtc: nextAvailable.startUtc,
              endUtc: nextAvailable.endUtc,
              label: nextAvailable.label,
            });
          }}
          className="mb-4 flex w-full items-center justify-between rounded-xl border-2 border-[var(--booking-accent-soft)] booking-bg-accent-muted px-4 py-3.5 text-left text-sm shadow-sm transition-colors hover:border-[var(--booking-accent)]"
        >
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wider booking-text-accent">
              {copy.nextAvailable}
            </span>
            <span className="mt-0.5 block font-semibold text-gray-800 dark:text-gray-200">
              {format(parseISO(nextAvailable.date + "T12:00:00"), "EEE d MMM")} · {nextAvailable.label}
            </span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full booking-bg-accent text-white">
            <Icon name="lightning-charge-fill" />
          </span>
        </button>
      )}

      <div className="flex min-w-0 flex-col gap-4 md:gap-5">
        <section className="min-w-0 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{copy.chooseDate}</p>
            <button
              type="button"
              onClick={() => setShowMobileCalendar((v) => !v)}
              className="text-xs font-medium booking-text-accent md:hidden"
            >
              {showMobileCalendar ? copy.quickDates : copy.fullCalendar}
            </button>
          </div>

          {showMobileCalendar ? (
            <MonthCalendar
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              dayStatus={monthDayStatus}
              onMonthChange={handleMonthChange}
              onSelect={onDateChange}
              size="comfortable"
            />
          ) : (
            <DateQuickStrip
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              copy={copy}
              onSelect={onDateChange}
            />
          )}

          <div className="mt-4 hidden min-w-0 md:block">
            <MonthCalendar
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              dayStatus={monthDayStatus}
              onMonthChange={handleMonthChange}
              onSelect={onDateChange}
              size="comfortable"
            />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 md:p-5">
          {dateHeading ? (
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dateHeading}</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.availableTimes}</span>
            </div>
          ) : (
            <p className="mb-3 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.selectDate}</p>
          )}

          {holdLabel && (
            <p className="mb-3 rounded-lg booking-bg-accent-muted px-3 py-2 text-xs font-medium booking-text-accent">
              <Icon name="clock" className="mr-1.5" />
              {holdLabel}
            </p>
          )}

          {slotUnavailable && (
            <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
              <p className="font-medium">{copy.slotTaken}</p>
              <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">{copy.slotTakenAction}</p>
            </div>
          )}

          {!hasFetched && !loadingSlots ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.selectDate}</p>
          ) : (
            <TimeSlotGrid
              slots={slots}
              selectedStartUtc={selectedSlot?.startUtc ?? null}
              copy={copy}
              onSelect={onSlotSelect}
              loading={loadingSlots}
              emptyState={slotEmptyState}
              timezone={timezone}
            />
          )}
        </section>
      </div>

      {dateHeading && selectedSlot && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-800 md:hidden">
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
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-800 dark:text-gray-200"
            >
              <Icon name="chevron-left" className="text-sm" /> {copy.back}
            </button>
          )}
          {showContinue && selectedSlot && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="ml-auto rounded-xl booking-bg-accent booking-bg-accent-hover px-5 py-2.5 text-sm font-semibold text-white booking-shadow-accent"
            >
              {copy.continue}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
