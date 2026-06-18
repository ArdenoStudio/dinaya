"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Staff } from "@/db/schema";
import { getBookingSessionToken } from "@/lib/booking-session";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import MonthCalendar, { type MonthDayStatus } from "./MonthCalendar";
import DateQuickStrip from "./DateQuickStrip";
import TimeSlotGrid, { type SlotEmptyState, type SlotOption } from "./TimeSlotGrid";
import { SlotListPanel } from "./SlotListPanel";
import { CalendarOverlayControl } from "./CalendarOverlayControl";
import type { GoogleCalendarOverlay } from "./useGoogleCalendarOverlay";

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
  hideSlots?: boolean;
  onSlotsChange?: (slots: SlotOption[], loading: boolean, emptyState: SlotEmptyState) => void;
  onCalendarMonthChange?: (month: string) => void;
  calendarOverlay?: GoogleCalendarOverlay;
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
  hideSlots = false,
  onSlotsChange,
  onCalendarMonthChange,
  calendarOverlay,
}: Props) {
  const today = toZonedTime(new Date(), timezone);
  const maxDate = service?.maximumAdvanceDays
    ? addDays(today, service.maximumAdvanceDays)
    : undefined;
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [slotEmptyState, setSlotEmptyState] = useState<SlotEmptyState>("none");
  const slotCacheRef = useRef<Record<string, { slots: SlotOption[]; emptyState: SlotEmptyState }>>({});
  const [nextAvailable, setNextAvailable] = useState<NextSlot | null>(null);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [monthDayStatus, setMonthDayStatus] = useState<Record<string, MonthDayStatus>>({});
  const [calendarMonth, setCalendarMonth] = useState(() => format(today, "yyyy-MM"));
  const autoAdvancedDateRef = useRef(false);

  const canLoad = Boolean(service && (staff || anyStaff));
  const sessionToken = typeof window !== "undefined" ? getBookingSessionToken() : "";

  useEffect(() => {
    slotCacheRef.current = {};
  }, [businessId, service?.id, staff?.id, anyStaff, dealId, locationId]);

  async function loadSlots(date: string) {
    if (!service || (!staff && !anyStaff)) return;

    const cached = slotCacheRef.current[date];
    if (cached) {
      setSlots(cached.slots);
      setSlotEmptyState(cached.emptyState);
      setHasFetched(true);
    }

    setLoadingSlots(true);
    onSlotsChange?.(cached?.slots ?? slots, true, cached?.emptyState ?? slotEmptyState);

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
    const fetchedSlots: SlotOption[] = data.slots ?? [];
    const fetchedEmptyState: SlotEmptyState =
      data.closed ? "closed" :
      data.capacityReached ? "capacity" :
      fetchedSlots.length === 0 ? "full" :
      "none";

    slotCacheRef.current[date] = { slots: fetchedSlots, emptyState: fetchedEmptyState };
    setSlots(fetchedSlots);
    setSlotEmptyState(fetchedEmptyState);
    setLoadingSlots(false);
    setHasFetched(true);
    onSlotsChange?.(fetchedSlots, false, fetchedEmptyState);
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
      slotCacheRef.current = {};
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
    autoAdvancedDateRef.current = false;
  }, [service?.id, staff?.id]);

  useEffect(() => {
    if (!canLoad || !hasFetched || autoAdvancedDateRef.current) return;
    if (slotEmptyState === "none" || !nextAvailable) return;
    if (nextAvailable.date === selectedDate) return;

    autoAdvancedDateRef.current = true;
    onDateChange(nextAvailable.date);
  }, [canLoad, hasFetched, slotEmptyState, nextAvailable, selectedDate, onDateChange]);

  useEffect(() => {
    if (!canLoad) {
      setMonthDayStatus({});
      return;
    }
    void loadMonthStatus(calendarMonth);
  }, [calendarMonth, canLoad, loadMonthStatus]);

  const handleMonthChange = useCallback(
    (month: string) => {
      setCalendarMonth(month);
      onCalendarMonthChange?.(month);
    },
    [onCalendarMonthChange],
  );

  const dateHeading = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEEE, d MMMM yyyy")
    : null;
  const compactDateHeading = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEE d")
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

  const showSlotSkeleton = loadingSlots && slots.length === 0;
  const isRefreshingSlots = loadingSlots && slots.length > 0;

  const slotPanelProps = {
    slots,
    selectedStartUtc: selectedSlot?.startUtc ?? null,
    copy,
    onSelect: onSlotSelect,
    loading: showSlotSkeleton,
    refreshing: isRefreshingSlots,
    emptyState: slotEmptyState,
    timezone,
    busyTimes: calendarOverlay?.busyTimes,
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
        {copy.pickDateTime}
      </p>

      {nextAvailable && nextAvailable.date !== selectedDate && hasFetched && slotEmptyState !== "none" && (
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

      <div className="flex min-w-0 flex-col md:grid md:min-h-[22rem] md:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] md:divide-x md:divide-border lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <section className="min-w-0 pb-4 md:px-6 md:pb-0 md:pt-0 lg:px-8">
          <div className="mb-3 flex items-center justify-between gap-2 md:mb-4">
            <p className="text-sm font-medium text-foreground md:sr-only">{copy.chooseDate}</p>
            <button
              type="button"
              onClick={() => setShowMobileCalendar((v) => !v)}
              className="text-xs font-medium booking-text-accent md:hidden"
            >
              {showMobileCalendar ? copy.quickDates : copy.fullCalendar}
            </button>
          </div>

          {calendarOverlay && (
            <div className="mb-4">
              <CalendarOverlayControl copy={copy} overlay={calendarOverlay} />
            </div>
          )}

          <div className="md:hidden">
            {showMobileCalendar ? (
              <MonthCalendar
                selectedDate={selectedDate}
                minDate={today}
                maxDate={maxDate}
                dayStatus={monthDayStatus}
                personalBusyDates={calendarOverlay?.busyDates}
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
          </div>

          <div className="hidden min-w-0 md:block">
            <MonthCalendar
              selectedDate={selectedDate}
              minDate={today}
              maxDate={maxDate}
              dayStatus={monthDayStatus}
              personalBusyDates={calendarOverlay?.busyDates}
              onMonthChange={handleMonthChange}
              onSelect={onDateChange}
              size="comfortable"
            />
          </div>
        </section>

        {!hideSlots && (
          <>
            <Separator className="md:hidden" />
            <section className="min-w-0 pt-4 md:flex md:flex-col md:px-4 md:pt-0 lg:px-5">
              {compactDateHeading ? (
                <div className="mb-3 flex items-baseline justify-between gap-2 md:mb-4">
                  <h3 className="text-sm font-semibold text-foreground md:text-base">{compactDateHeading}</h3>
                  <span className="hidden text-xs text-muted-foreground md:inline">{copy.availableTimes}</span>
                </div>
              ) : (
                <p className="mb-3 text-xs text-muted-foreground">{copy.selectDate}</p>
              )}

              {dateHeading && (
                <p className="mb-3 text-sm font-semibold text-foreground md:hidden">{dateHeading}</p>
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
                <p className="py-6 text-center text-sm text-muted-foreground">{copy.selectDate}</p>
              ) : (
                <>
                  <div className="md:hidden">
                    <TimeSlotGrid {...slotPanelProps} />
                  </div>
                  <div className="hidden max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto md:block md:pr-1">
                    <SlotListPanel {...slotPanelProps} />
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>

      {dateHeading && selectedSlot && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-800 md:hidden">
          <Icon name="check-circle" className="mr-1.5" />
          <span className="font-medium">{selectedSlot.label}</span>
          <span className="text-emerald-600"> · {dateHeading}</span>
        </div>
      )}

      {(onBack || showContinue) && (
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4 md:hidden">
          {onBack && (
            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="px-0">
              <Icon name="chevron-left" />
              {copy.back}
            </Button>
          )}
          {showContinue && selectedSlot && onContinue && (
            <Button
              type="button"
              className="ml-auto bg-[var(--booking-accent)] text-white hover:bg-[var(--booking-accent)]/90"
              onClick={onContinue}
            >
              {copy.continue}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
