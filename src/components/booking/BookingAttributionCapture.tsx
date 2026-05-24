"use client";

import { useEffect } from "react";
import {
  mergeAttribution,
  parseAttributionFromSearchParams,
  storeAttribution,
} from "@/lib/booking-attribution";

export function BookingAttributionCapture({ businessId }: { businessId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseAttributionFromSearchParams(params);
    const embedded = window.self !== window.top;

    const attribution = mergeAttribution(parsed, embedded ? { channel: "embed" } : {});
    storeAttribution(businessId, attribution);
  }, [businessId]);

  return null;
}
