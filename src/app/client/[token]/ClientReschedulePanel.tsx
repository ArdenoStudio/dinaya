"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "@/components/booking/BookingWizard";
import StepDateTime from "@/components/booking/StepDateTime";
import { useSlotHold } from "@/components/booking/useSlotHold";
import type { SlotOption } from "@/components/booking/TimeSlotGrid";

interface Props {
  token: string;
  businessId: string;
  service: BookingService;
  staff: Staff;
  timezone: string;
  copy: BookingCopy;
  currentStartsAt: string;
  onRescheduled: () => void;
}

export function ClientReschedulePanel({
  token,
  businessId,
  service,
  staff,
  timezone,
  copy,
  currentStartsAt,
  onRescheduled,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(toZonedTime(new Date(), timezone), "yyyy-MM-dd"),
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slotHold = useSlotHold({
    businessId,
    serviceId: service.id,
    staffId: staff.id,
    enabled: true,
  });

  const selectSlot = useCallback(
    async (slot: SlotOption) => {
      const ok = await slotHold.reserveSlot(slot);
      if (!ok) {
        setSelectedSlot(null);
        return;
      }
      setSelectedSlot(slot);
    },
    [slotHold],
  );

  async function confirmReschedule() {
    if (!selectedSlot || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/client/bookings/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: selectedSlot.startUtc,
          endsAt: selectedSlot.endUtc,
          sessionToken: slotHold.sessionToken || undefined,
        }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? copy.clientReschedule);
        return;
      }
      void slotHold.releaseHold();
      onRescheduled();
    } catch {
      setError(copy.clientReschedule);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-gray-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{copy.clientChooseNewTime}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {copy.clientCurrentAppointment}: {new Date(currentStartsAt).toLocaleString()}
      </p>
      <div className="mt-4">
        <StepDateTime
          businessId={businessId}
          copy={copy}
          service={service}
          staff={staff}
          timezone={timezone}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          holdLabel={slotHold.holdLabel}
          slotUnavailable={slotHold.slotUnavailable}
          onDateChange={(date) => {
            setSelectedDate(date);
            setSelectedSlot(null);
            void slotHold.releaseHold();
          }}
          onSlotSelect={selectSlot}
        />
      </div>
      {selectedSlot ? (
        <button
          type="button"
          disabled={loading || slotHold.holding}
          onClick={confirmReschedule}
          className="mt-4 w-full rounded-xl booking-bg-accent px-4 py-3 text-sm font-semibold text-white booking-shadow-accent hover:opacity-90 disabled:opacity-60"
        >
          {loading ? copy.clientWorking : copy.clientReschedule}
        </button>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
