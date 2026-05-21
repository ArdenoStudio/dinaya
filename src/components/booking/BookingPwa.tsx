"use client";

import { useEffect } from "react";

export function BookingPwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures in unsupported contexts.
    });
  }, []);

  return null;
}
