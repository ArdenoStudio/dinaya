"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
};

export function DealSuggestionsCard({ businessId }: { businessId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/deals/suggestions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, [businessId]);

  if (suggestions.length === 0) return null;

  const suggestion = suggestions[0]!;

  async function dismiss(id: string) {
    await fetch(`/api/dashboard/deals/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-primary">Smart deal suggestion</p>
      <p className="mt-1 text-sm">{suggestion.headline ?? suggestion.reason}</p>
      {suggestion.learningLine && (
        <p className="mt-1 text-xs text-muted-foreground">{suggestion.learningLine}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
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
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Create deal
        </Link>
        <button
          type="button"
          onClick={() => dismiss(suggestion.id)}
          className="rounded-md border bg-white px-3 py-1.5 text-xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
