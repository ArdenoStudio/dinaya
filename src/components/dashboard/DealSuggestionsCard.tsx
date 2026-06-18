"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildDealFormUrl } from "@/lib/deals/urls";

type Suggestion = {
  id: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  locationId: string;
  suggestedDiscountPercent: number;
  suggestedSlotsTotal: number;
  apptWindowStart: string;
  apptWindowEnd: string;
  reason: string;
  headline?: string;
  learningLine?: string | null;
  demandLine?: string | null;
  meta?: unknown;
};

function SuggestionCard({
  suggestion,
  onDismiss,
  onPublished,
}: {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
  onPublished: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const learningLine = suggestion.learningLine;
  const demandLine = suggestion.demandLine;

  async function publishDeal() {
    setPublishing(true);
    setError("");

    const res = await fetch("/api/dashboard/deals/publish-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: suggestion.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not publish deal.");
      setPublishing(false);
      return;
    }

    onPublished();
    setPublishing(false);
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-primary">Smart deal suggestion</p>
      <p className="mt-1 text-sm">{suggestion.headline ?? suggestion.reason}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {suggestion.serviceName} · {suggestion.suggestedDiscountPercent}% off · {suggestion.suggestedSlotsTotal} slot{suggestion.suggestedSlotsTotal === 1 ? "" : "s"}
      </p>
      {learningLine && (
        <p className="mt-1 text-xs text-muted-foreground">{learningLine}</p>
      )}
      {demandLine && (
        <p className="mt-1 text-xs text-muted-foreground">{demandLine}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={publishDeal}
          disabled={publishing}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {publishing ? "Publishing…" : "Publish deal"}
        </button>
        <Link
          href={buildDealFormUrl({
            serviceId: suggestion.serviceId,
            staffId: suggestion.staffId,
            locationId: suggestion.locationId,
            discountPercent: suggestion.suggestedDiscountPercent,
            slotsTotal: suggestion.suggestedSlotsTotal,
            apptWindowStart: suggestion.apptWindowStart,
            apptWindowEnd: suggestion.apptWindowEnd,
            suggestionId: suggestion.id,
          })}
          className="rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs"
        >
          Customize
        </Link>
        <button
          type="button"
          onClick={() => onDismiss(suggestion.id)}
          className="rounded-md border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1.5 text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function DealSuggestionsCard({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/deals/suggestions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, [businessId]);

  if (suggestions.length === 0) return null;

  async function dismiss(id: string) {
    await fetch(`/api/dashboard/deals/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onDismiss={dismiss}
          onPublished={() => {
            setSuggestions((prev) => prev.filter((item) => item.id !== suggestion.id));
            router.refresh();
          }}
        />
      ))}
    </div>
  );
}
