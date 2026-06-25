"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { planDisplayName, type DisplayPlan } from "@/lib/plan-display";

export function CancelButton({ plan }: { plan: DisplayPlan }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const planLabel = planDisplayName(plan);

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        Cancel {planLabel}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 p-4">
      <p className="text-sm text-red-900">
        Cancel your {planLabel} subscription? You&apos;ll keep {planLabel} features until the current period ends.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white dark:hover:bg-neutral-800"
        >
          Keep {planLabel}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
