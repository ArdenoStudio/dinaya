"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

/** Fixed theme control for public booking pages (hub + wizard). */
export function BookingThemeToggle() {
  return (
    <div className="fixed right-4 top-4 z-50 md:right-6 md:top-6">
      <ThemeToggle variant="pill" />
    </div>
  );
}
