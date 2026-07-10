"use client";

import { useEffect, useState } from "react";

/**
 * Radix portals mount at document.body, outside the [data-booking-theme]
 * wrapper that carries the tenant's --booking-* variables as inline styles.
 * Returns those variables so portaled content can keep the tenant branding.
 */
export function useBookingThemeVars(active: boolean): Record<string, string> | null {
  const [themeVars, setThemeVars] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!active) return;
    const host = document.querySelector<HTMLElement>("[data-booking-theme]");
    if (!host) return;
    const vars: Record<string, string> = {};
    for (let i = 0; i < host.style.length; i++) {
      const name = host.style.item(i);
      if (name.startsWith("--booking-")) {
        vars[name] = host.style.getPropertyValue(name);
      }
    }
    setThemeVars(vars);
  }, [active]);

  return themeVars;
}
