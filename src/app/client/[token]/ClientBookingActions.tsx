"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  token: string;
  canCancel: boolean;
  cancelReason?: string;
}

export function ClientBookingActions({ token, canCancel, cancelReason }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function handleCancel() {
    if (!canCancel || loading) return;

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

  if (cancelled) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your booking has been cancelled.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {canCancel ? (
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {loading ? "Cancelling…" : "Cancel appointment"}
        </button>
      ) : cancelReason ? (
        <p className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-muted-foreground">
          {cancelReason}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
