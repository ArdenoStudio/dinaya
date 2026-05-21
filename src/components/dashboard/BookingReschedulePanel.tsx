"use client";

import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";

type Slot = {
  startUtc: string;
  endUtc: string;
  label: string;
};

interface Props {
  bookingId: string;
  serviceDuration: number;
  canReschedule: boolean;
  currentStartsAt: string;
}

export function BookingReschedulePanel({
  bookingId,
  serviceDuration,
  canReschedule,
  currentStartsAt,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !canReschedule) return;

    let cancelled = false;
    async function loadAvailability() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/dashboard/bookings/${bookingId}/availability?date=${selectedDate}`);
        const data = await response.json().catch(() => ({})) as { slots?: Slot[]; error?: string };
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error ?? "Could not load availability.");
          setSlots([]);
          return;
        }
        setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setError("Could not load availability.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [open, canReschedule, bookingId, selectedDate]);

  async function handleReschedule(slot: Slot) {
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: slot.startUtc,
        endsAt: slot.endUtc,
      }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string; startsAt?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not reschedule booking.");
      setSaving(false);
      return;
    }

    setSuccess(`Rescheduled to ${format(new Date(data.startsAt ?? slot.startUtc), "d MMM yyyy, h:mm a")}`);
    setOpen(false);
    setSaving(false);
    window.location.reload();
  }

  if (!canReschedule) return null;

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reschedule</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Current: {format(new Date(currentStartsAt), "d MMM yyyy, h:mm a")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-primary/40"
        >
          {open ? "Close" : "Move appointment"}
        </button>
      </div>

      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {open ? (
        <div className="mt-4 space-y-4 border-t pt-4">
          <label className="block text-sm">
            New date
            <input
              type="date"
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 60), "yyyy-MM-dd")}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading open slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open {serviceDuration}-minute slots on this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startUtc}
                  type="button"
                  disabled={saving}
                  onClick={() => handleReschedule(slot)}
                  className="rounded-lg border px-3 py-2 text-sm hover:border-primary/40 disabled:opacity-60"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
