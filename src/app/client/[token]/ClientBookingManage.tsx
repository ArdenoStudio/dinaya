"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";

type Slot = {
  startUtc: string;
  endUtc: string;
  label: string;
};

interface Props {
  token: string;
  canModify: boolean;
  modifyReason?: string;
  currentStartsAt: string;
}

export function ClientBookingManage({
  token,
  canModify,
  modifyReason,
  currentStartsAt,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const minDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const maxDate = useMemo(() => format(addDays(new Date(), 60), "yyyy-MM-dd"), []);

  useEffect(() => {
    if (!showReschedule || !canModify) return;

    let cancelledRequest = false;
    async function loadSlots() {
      setSlotsLoading(true);
      setError(null);
      setBlockedReason(null);

      try {
        const response = await fetch(
          `/api/client/bookings/${token}/availability?date=${selectedDate}`,
        );
        const data = await response.json().catch(() => ({})) as {
          slots?: Slot[];
          blockedReason?: string;
          error?: string;
        };

        if (cancelledRequest) return;

        if (!response.ok) {
          setError(data.error ?? "Could not load available times.");
          setSlots([]);
          return;
        }

        setBlockedReason(data.blockedReason ?? null);
        setSlots(data.slots ?? []);
      } catch {
        if (!cancelledRequest) {
          setError("Could not load available times.");
          setSlots([]);
        }
      } finally {
        if (!cancelledRequest) setSlotsLoading(false);
      }
    }

    void loadSlots();
    return () => {
      cancelledRequest = true;
    };
  }, [showReschedule, canModify, selectedDate, token]);

  async function handleCancel() {
    if (!canModify || loading) return;

    const confirmed = window.confirm("Cancel this appointment?");
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/bookings/${token}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by client" }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not cancel booking.");
        return;
      }

      setCancelled(true);
      router.refresh();
    } catch {
      setError("Could not cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule(slot: Slot) {
    if (!canModify || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/bookings/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: slot.startUtc,
          endsAt: slot.endUtc,
        }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not reschedule booking.");
        return;
      }

      setRescheduled(true);
      setShowReschedule(false);
      router.refresh();
    } catch {
      setError("Could not reschedule booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your booking has been cancelled.
      </p>
    );
  }

  if (rescheduled) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your booking has been rescheduled. Check your messages for the updated time.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!canModify && modifyReason ? (
        <p className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-muted-foreground">
          {modifyReason}
        </p>
      ) : null}

      {canModify ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setShowReschedule((value) => !value)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            {showReschedule ? "Hide reschedule" : "Reschedule"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {loading ? "Working…" : "Cancel appointment"}
          </button>
        </div>
      ) : null}

      {showReschedule && canModify ? (
        <div className="rounded-xl border bg-gray-50/80 p-4">
          <p className="text-sm font-medium">Choose a new time</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Current appointment: {format(new Date(currentStartsAt), "d MMM yyyy, h:mm a")}
          </p>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            Date
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4">
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading available times…</p>
            ) : blockedReason ? (
              <p className="text-sm text-muted-foreground">{blockedReason}</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open slots on this date. Try another day.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.startUtc}
                    type="button"
                    disabled={loading}
                    onClick={() => handleReschedule(slot)}
                    className="rounded-lg border bg-white px-3 py-2 text-sm hover:border-primary/40 disabled:opacity-60"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
