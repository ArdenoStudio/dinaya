"use client";

import { useEffect } from "react";

/** Sync booking query params via History API — avoids Next.js RSC navigation after hub pushState. */
export function useBookingInstantUrlSync(input: {
  date: string;
  slotStartUtc: string;
  staffId: string | null;
  dealId: string | null;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (input.enabled === false || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const apply = (key: string, value: string, paramKey = key) => {
      if (value === "") params.delete(paramKey);
      else params.set(paramKey, value);
    };

    apply("date", input.date || "");
    apply("slot", input.slotStartUtc || "");
    apply("staffId", input.staffId || "", "staff");
    apply("dealId", input.dealId || "");

    const qs = params.toString();
    const href = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", href);
  }, [input.date, input.slotStartUtc, input.staffId, input.dealId, input.enabled]);
}
