import type { CSSProperties } from "react";

export const DEFAULT_BOOKING_ACCENT = "#2563eb";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type BookingPageBackground = "white" | "grouped" | "custom" | "accent";
export type BookingPanelBackground = "white" | "accent";
export type BookingHeroOverlay = "light" | "dark" | "brand" | "none";
export type BookingThemePreset = "classic" | "salon" | "salon_vivid" | "spa" | "bold" | "custom";

export type BookingThemeSource = {
  accentColor?: string | null;
  bookingPageBackground?: string | null;
  bookingPageBackgroundColor?: string | null;
  bookingPanelBackground?: string | null;
  bookingHeroOverlay?: string | null;
  bookingHeroOverlayOpacity?: number | null;
  bookingThemePreset?: string | null;
};

export type ResolvedBookingTheme = {
  accentColor: string;
  pageBackground: BookingPageBackground;
  pageBackgroundColor: string | null;
  panelBackground: BookingPanelBackground;
  heroOverlay: BookingHeroOverlay;
  heroOverlayOpacity: number;
  themePreset: BookingThemePreset | null;
};

export type BookingThemeOverrides = Partial<{
  accentColor: string | null;
  pageBackground: BookingPageBackground;
  pageBackgroundColor: string | null;
  panelBackground: BookingPanelBackground;
  heroOverlay: BookingHeroOverlay;
  heroOverlayOpacity: number;
}>;

export const BOOKING_THEME_PRESETS: Record<
  Exclude<BookingThemePreset, "custom">,
  Omit<ResolvedBookingTheme, "themePreset">
> = {
  classic: {
    accentColor: "#2563eb",
    pageBackground: "white",
    pageBackgroundColor: null,
    panelBackground: "white",
    heroOverlay: "light",
    heroOverlayOpacity: 60,
  },
  salon: {
    accentColor: "#ff46a2",
    pageBackground: "custom",
    pageBackgroundColor: "#fff6f8",
    panelBackground: "white",
    heroOverlay: "brand",
    heroOverlayOpacity: 55,
  },
  salon_vivid: {
    accentColor: "#ff46a2",
    pageBackground: "accent",
    pageBackgroundColor: null,
    panelBackground: "accent",
    heroOverlay: "brand",
    heroOverlayOpacity: 55,
  },
  spa: {
    accentColor: "#5a7a6a",
    pageBackground: "white",
    pageBackgroundColor: null,
    panelBackground: "white",
    heroOverlay: "light",
    heroOverlayOpacity: 50,
  },
  bold: {
    accentColor: "#5c1f2e",
    pageBackground: "white",
    pageBackgroundColor: null,
    panelBackground: "white",
    heroOverlay: "dark",
    heroOverlayOpacity: 70,
  },
};

const PAGE_BACKGROUNDS = new Set<BookingPageBackground>(["white", "grouped", "custom", "accent"]);
const PANEL_BACKGROUNDS = new Set<BookingPanelBackground>(["white", "accent"]);
const HERO_OVERLAYS = new Set<BookingHeroOverlay>(["light", "dark", "brand", "none"]);
const THEME_PRESETS = new Set<BookingThemePreset>([
  "classic",
  "salon",
  "salon_vivid",
  "spa",
  "bold",
  "custom",
]);

const SALON_VIVID_PAGE_TINT = 0.12;
const SALON_VIVID_PANEL_TINT = 0.48;
const ACCENT_PAGE_TINT = 0.38;
const ACCENT_PANEL_TINT = 0.38;

export function normalizeAccentColor(input: string | null | undefined): string {
  if (!input) return DEFAULT_BOOKING_ACCENT;
  const trimmed = input.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  return DEFAULT_BOOKING_ACCENT;
}

function normalizePageBackground(value: string | null | undefined): BookingPageBackground {
  if (value && PAGE_BACKGROUNDS.has(value as BookingPageBackground)) {
    return value as BookingPageBackground;
  }
  return "white";
}

function normalizePanelBackground(value: string | null | undefined): BookingPanelBackground {
  if (value && PANEL_BACKGROUNDS.has(value as BookingPanelBackground)) {
    return value as BookingPanelBackground;
  }
  return "white";
}

function normalizeHeroOverlay(value: string | null | undefined): BookingHeroOverlay {
  if (value && HERO_OVERLAYS.has(value as BookingHeroOverlay)) {
    return value as BookingHeroOverlay;
  }
  return "light";
}

function normalizeOpacity(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 60;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizePreset(value: string | null | undefined): BookingThemePreset | null {
  if (value && THEME_PRESETS.has(value as BookingThemePreset)) {
    return value as BookingThemePreset;
  }
  return null;
}

function normalizeBackgroundColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return HEX_COLOR.test(trimmed) ? trimmed.toLowerCase() : null;
}

function accentPageTintStrength(theme: ResolvedBookingTheme): number {
  if (theme.themePreset === "salon_vivid" && theme.panelBackground === "accent") {
    return SALON_VIVID_PAGE_TINT;
  }
  if (theme.themePreset === "salon_vivid") {
    return SALON_VIVID_PANEL_TINT;
  }
  return ACCENT_PAGE_TINT;
}

function accentPanelTintStrength(theme: ResolvedBookingTheme): number {
  if (theme.themePreset === "salon_vivid") {
    return SALON_VIVID_PANEL_TINT;
  }
  return ACCENT_PANEL_TINT;
}

export function resolveBookingTheme(
  source: BookingThemeSource,
  options?: { canUseExtendedTheme?: boolean; overrides?: BookingThemeOverrides },
): ResolvedBookingTheme {
  const canUseExtendedTheme = options?.canUseExtendedTheme ?? true;
  const overrides = options?.overrides;

  const preset = normalizePreset(source.bookingThemePreset);
  const presetValues =
    preset && preset !== "custom" ? BOOKING_THEME_PRESETS[preset] : null;

  const accentColor = normalizeAccentColor(
    overrides?.accentColor ?? source.accentColor ?? presetValues?.accentColor,
  );

  if (!canUseExtendedTheme) {
    return {
      accentColor,
      pageBackground: "white",
      pageBackgroundColor: null,
      panelBackground: "white",
      heroOverlay: "light",
      heroOverlayOpacity: 60,
      themePreset: preset,
    };
  }

  return {
    accentColor,
    pageBackground: normalizePageBackground(
      overrides?.pageBackground ??
        source.bookingPageBackground ??
        presetValues?.pageBackground,
    ),
    pageBackgroundColor: normalizeBackgroundColor(
      overrides?.pageBackgroundColor ??
        source.bookingPageBackgroundColor ??
        presetValues?.pageBackgroundColor ??
        null,
    ),
    panelBackground: normalizePanelBackground(
      overrides?.panelBackground ??
        source.bookingPanelBackground ??
        presetValues?.panelBackground,
    ),
    heroOverlay: normalizeHeroOverlay(
      overrides?.heroOverlay ?? source.bookingHeroOverlay ?? presetValues?.heroOverlay,
    ),
    heroOverlayOpacity: normalizeOpacity(
      overrides?.heroOverlayOpacity ??
        source.bookingHeroOverlayOpacity ??
        presetValues?.heroOverlayOpacity,
    ),
    themePreset: preset,
  };
}

export function resolvePageBackgroundColor(theme: ResolvedBookingTheme): string {
  if (theme.pageBackground === "accent") {
    return tintAccentBackground(theme.accentColor, accentPageTintStrength(theme));
  }
  if (theme.pageBackground === "custom" && theme.pageBackgroundColor) {
    return theme.pageBackgroundColor;
  }
  if (theme.pageBackground === "grouped") {
    return "#f2f2f7";
  }
  return "#ffffff";
}

export function resolvePanelBackgroundColor(theme: ResolvedBookingTheme): string {
  if (theme.panelBackground === "accent") {
    return tintAccentBackground(theme.accentColor, accentPanelTintStrength(theme));
  }
  return "#ffffff";
}

/** Apple-style dark canvas — keeps accent on chrome, not washed-out blush. */
export function resolveDarkPageBackgroundColor(theme: ResolvedBookingTheme): string {
  if (theme.pageBackground === "accent") {
    return tintAccentBackground(theme.accentColor, 0.12);
  }
  if (theme.pageBackground === "custom" && theme.pageBackgroundColor) {
    return "#0a0909";
  }
  return "#000000";
}

function resolveDarkPanelBackgroundColor(theme: ResolvedBookingTheme): string {
  if (theme.panelBackground === "accent") {
    return tintAccentBackground(theme.accentColor, 0.2);
  }
  return "#1c1c1e";
}

/** Blend accent into white for page canvas (strength 0–1 = more pink). */
export function tintAccentBackground(accentHex: string, strength: number): string {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return "#fff6f8";
  const clamped = Math.min(1, Math.max(0, strength));
  const mix = (channel: number) =>
    Math.round(channel * clamped + 255 * (1 - clamped));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(rgb.r))}${toHex(mix(rgb.g))}${toHex(mix(rgb.b))}`;
}

function resolvePageBackgroundColorForMode(theme: ResolvedBookingTheme, isDark: boolean): string {
  return isDark ? resolveDarkPageBackgroundColor(theme) : resolvePageBackgroundColor(theme);
}

function resolvePanelBackgroundColorForMode(theme: ResolvedBookingTheme, isDark: boolean): string {
  return isDark ? resolveDarkPanelBackgroundColor(theme) : resolvePanelBackgroundColor(theme);
}

function resolveHeroOverlayColor(theme: ResolvedBookingTheme): string {
  switch (theme.heroOverlay) {
    case "dark":
      return "#000000";
    case "brand":
      return theme.accentColor;
    case "none":
      return "transparent";
    case "light":
    default:
      return "#ffffff";
  }
}

/** CSS custom properties for tenant-branded booking surfaces. */
export function buildBookingThemeStyle(
  theme: ResolvedBookingTheme,
  options?: { isDark?: boolean },
): CSSProperties {
  const opacity = theme.heroOverlayOpacity / 100;
  const isDark = options?.isDark ?? false;
  return {
    "--booking-accent": theme.accentColor,
    "--booking-page-bg": resolvePageBackgroundColorForMode(theme, isDark),
    "--booking-panel-bg": resolvePanelBackgroundColorForMode(theme, isDark),
    "--booking-hero-overlay": resolveHeroOverlayColor(theme),
    "--booking-hero-overlay-opacity": String(opacity),
  } as CSSProperties;
}

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeAccentColor(hex);
  if (normalized === DEFAULT_BOOKING_ACCENT && hex.trim() && !HEX_COLOR.test(hex.trim())) {
    return null;
  }
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number | null {
  const foreground = hexToRgb(foregroundHex);
  const background = hexToRgb(backgroundHex);
  if (!foreground || !background) return null;

  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function accentContrastWarning(accentHex: string, backgroundHex = "#ffffff"): string | null {
  const ratio = contrastRatio(accentHex, backgroundHex);
  if (ratio === null) return "Enter a valid accent color.";
  if (ratio < 3) {
    return "This accent may be hard to read on buttons and links. Try a darker or more saturated color.";
  }
  if (ratio < 4.5) {
    return "Contrast is acceptable for large text, but small labels may be hard to read.";
  }
  return null;
}

export function parseBookingThemePreviewParams(
  searchParams: URLSearchParams,
): BookingThemeOverrides | null {
  const accentColor = searchParams.get("previewAccent");
  const pageBackground = searchParams.get("previewPageBg");
  const pageBackgroundColor = searchParams.get("previewPageBgColor");
  const panelBackground = searchParams.get("previewPanelBg");
  const heroOverlay = searchParams.get("previewHeroOverlay");
  const heroOverlayOpacity = searchParams.get("previewHeroOpacity");

  if (
    !accentColor &&
    !pageBackground &&
    !pageBackgroundColor &&
    !panelBackground &&
    !heroOverlay &&
    !heroOverlayOpacity
  ) {
    return null;
  }

  const overrides: BookingThemeOverrides = {};
  if (accentColor) overrides.accentColor = accentColor;
  if (pageBackground && PAGE_BACKGROUNDS.has(pageBackground as BookingPageBackground)) {
    overrides.pageBackground = pageBackground as BookingPageBackground;
  }
  if (pageBackgroundColor) overrides.pageBackgroundColor = pageBackgroundColor;
  if (panelBackground && PANEL_BACKGROUNDS.has(panelBackground as BookingPanelBackground)) {
    overrides.panelBackground = panelBackground as BookingPanelBackground;
  }
  if (heroOverlay && HERO_OVERLAYS.has(heroOverlay as BookingHeroOverlay)) {
    overrides.heroOverlay = heroOverlay as BookingHeroOverlay;
  }
  if (heroOverlayOpacity) {
    const parsed = Number(heroOverlayOpacity);
    if (!Number.isNaN(parsed)) overrides.heroOverlayOpacity = parsed;
  }

  return overrides;
}
