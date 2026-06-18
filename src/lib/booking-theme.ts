import type { CSSProperties } from "react";

export const DEFAULT_BOOKING_ACCENT = "#2563eb";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function normalizeAccentColor(input: string | null | undefined): string {
  if (!input) return DEFAULT_BOOKING_ACCENT;
  const trimmed = input.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  return DEFAULT_BOOKING_ACCENT;
}

/** CSS custom properties for tenant-branded booking surfaces. */
export function buildBookingThemeStyle(accentColor?: string | null): CSSProperties {
  const accent = normalizeAccentColor(accentColor);
  // Only set the base accent — all derived variables (muted, soft, shadow, etc.)
  // are computed by CSS rules in globals.css, which handle dark mode correctly.
  // Inlining them here would override the .dark [data-booking-theme] rules.
  return { "--booking-accent": accent } as CSSProperties;
}
