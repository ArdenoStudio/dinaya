"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "@/components/booking/BookingWizard";
import type { Staff } from "@/db/schema";
import { ClientReschedulePanel } from "./ClientReschedulePanel";
import { Icon } from "@/components/ui/Icon";

interface Props {
  token: string;
  businessId: string;
  service: BookingService;
  staff: Staff;
  timezone: string;
  copy: BookingCopy;
  canModify: boolean;
  modifyReason?: string;
  currentStartsAt: string;
}

const CANCEL_PRESET_KEYS = [
  "clientCancelPresetSchedule",
  "clientCancelPresetOtherTime",
  "clientCancelPresetMistake",
  "clientCancelPresetNoLonger",
  "clientCancelPresetOther",
] as const;

export function ClientBookingManage({
  token,
  businessId,
  service,
  staff,
  timezone,
  copy,
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
  const [showCancel, setShowCancel] = useState(false);
  const [cancelPreset, setCancelPreset] = useState<string>("");
  const [cancelNote, setCancelNote] = useState("");

  async function handleCancel() {
    if (!canModify || loading) return;
    if (!cancelPreset) {
      setError(copy.clientCancelReason);
      return;
    }

    const presetLabel = copy[cancelPreset as keyof BookingCopy] as string;
    const reason = cancelNote.trim()
      ? `${presetLabel}: ${cancelNote.trim()}`
      : presetLabel;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/client/bookings/${token}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? copy.clientCancelAppointment);
        return;
      }
      setCancelled(true);
      router.refresh();
    } catch {
      setError(copy.clientCancelAppointment);
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) {
    return (
      <p className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
        {copy.clientCancelledSuccess}
      </p>
    );
  }

  if (rescheduled) {
    return (
      <p className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
        {copy.clientRescheduledSuccess}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!canModify && modifyReason ? (
        <p className="rounded-xl border bg-gray-50 dark:bg-neutral-900/60 px-4 py-3 text-sm text-muted-foreground">
          {modifyReason}
        </p>
      ) : null}

      {canModify ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setShowReschedule((value) => !value);
              setShowCancel(false);
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            <Icon name="calendar2-week" className="text-sm" />
            {showReschedule ? copy.clientHideReschedule : copy.clientReschedule}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCancel((value) => !value);
              setShowReschedule(false);
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 disabled:opacity-60"
          >
            <Icon name="x-circle" className="text-sm" />
            {copy.clientCancelAppointment}
          </button>
        </div>
      ) : null}

      {showReschedule && canModify ? (
        <div className="rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50/80 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{copy.clientRescheduleSummary}</p>
          <ClientReschedulePanel
            token={token}
            businessId={businessId}
            service={service}
            staff={staff}
            timezone={timezone}
            copy={copy}
            currentStartsAt={currentStartsAt}
            onRescheduled={() => {
              setRescheduled(true);
              setShowReschedule(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      {showCancel && canModify ? (
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">{copy.clientCancelReason}</p>
          <p className="mt-1 text-xs text-red-800/80 dark:text-red-300/80">{copy.clientCancelWhatHappens}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CANCEL_PRESET_KEYS.map((key) => {
              const label = copy[key];
              const selected = cancelPreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCancelPreset(key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-red-400 bg-white text-red-800 dark:bg-neutral-900"
                      : "border-red-200 bg-white/70 text-red-700 hover:border-red-300 dark:border-red-900/50 dark:bg-neutral-900/60 dark:text-red-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <label className="mt-3 block text-xs font-medium text-red-900 dark:text-red-200">
            {copy.clientCancelNote}
            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-red-900/50 dark:bg-neutral-900 dark:text-gray-100"
            />
          </label>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading || !cancelPreset}
            className="mt-3 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? copy.clientWorking : copy.clientCancelAppointment}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
