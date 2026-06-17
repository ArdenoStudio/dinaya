"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

/** Fixed theme control for auth screens without the public nav. */
export function AuthThemeToggle() {
  return (
    <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
      <ThemeToggle variant="pill" />
    </div>
  );
}
