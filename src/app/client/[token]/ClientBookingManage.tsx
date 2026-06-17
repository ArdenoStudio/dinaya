"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "@/components/booking/BookingWizard";
import type { Staff } from "@/db/schema";
import { ClientReschedulePanel } from "./ClientReschedulePanel";

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

  async function handleCancel() {
    if (!canModify || loading) return;
    if (!window.confirm(copy.clientCancelConfirm)) return;

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
            onClick={() => setShowReschedule((value) => !value)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            {showReschedule ? copy.clientHideReschedule : copy.clientReschedule}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 disabled:opacity-60"
          >
            {loading ? copy.clientWorking : copy.clientCancelAppointment}
          </button>
        </div>
      ) : null}

      {showReschedule && canModify ? (
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
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
