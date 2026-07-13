"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

/** Theme control for public booking pages — icon on phone, labeled pill from md+. */
export function BookingThemeToggle() {
  return (
    <div className="fixed right-3 top-3 z-50 md:right-6 md:top-6">
      <ThemeToggle className="md:hidden" variant="icon" />
      <ThemeToggle className="hidden md:inline-flex" variant="pill" />
    </div>
  );
}
