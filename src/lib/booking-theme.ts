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
  return {
    "--booking-accent": accent,
    "--booking-accent-hover": `color-mix(in srgb, ${accent} 88%, black)`,
    "--booking-accent-muted": `color-mix(in srgb, ${accent} 10%, white)`,
    "--booking-accent-soft": `color-mix(in srgb, ${accent} 18%, white)`,
    "--booking-accent-ring": `color-mix(in srgb, ${accent} 28%, transparent)`,
    "--booking-accent-shadow": `color-mix(in srgb, ${accent} 35%, transparent)`,
    "--booking-accent-on-dark": `color-mix(in srgb, ${accent} 55%, white)`,
  } as CSSProperties;
}
