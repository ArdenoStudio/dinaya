"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type Props = {
  /** When set, renders in-flow (e.g. breadcrumb chrome) instead of fixed. */
  inline?: boolean;
  className?: string;
};

/**
 * Theme control for public booking pages — icon on phone, labeled pill from md+.
 * Fixed by default; use `inline` inside booking chrome so it shares a row with breadcrumbs.
 * Fixed mobile icon hides while `html[data-booking-chrome]` is set (inline chrome owns it).
 */
export function BookingThemeToggle({ inline = false, className }: Props) {
  if (inline) {
    return (
      <div className={cn("shrink-0", className)}>
        <ThemeToggle variant="icon" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-3 top-[max(1rem,env(safe-area-inset-top))] z-50 md:right-6 md:top-6",
        // Breadcrumb chrome owns the mobile toggle — avoid a second, misaligned control.
        "max-md:[html[data-booking-chrome]_&]:hidden",
        className,
      )}
    >
      <ThemeToggle className="md:hidden" variant="icon" />
      <ThemeToggle className="hidden md:inline-flex" variant="pill" />
    </div>
  );
}
