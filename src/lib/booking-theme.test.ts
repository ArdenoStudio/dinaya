import { describe, expect, it } from "vitest";
import {
  accentContrastWarning,
  buildBookingThemeStyle,
  contrastRatio,
  normalizeAccentColor,
  resolveBookingTheme,
  BOOKING_THEME_PRESETS,
} from "@/lib/booking-theme";
import { slugifyServiceName } from "@/lib/service-slug";

describe("booking-theme", () => {
  it("normalizes valid hex colors", () => {
    expect(normalizeAccentColor("#AbCdEf")).toBe("#abcdef");
  });

  it("falls back for invalid colors", () => {
    expect(normalizeAccentColor("red")).toBe("#2563eb");
    expect(normalizeAccentColor(null)).toBe("#2563eb");
  });

  it("builds CSS variables from resolved theme", () => {
    const style = buildBookingThemeStyle(
      resolveBookingTheme({
        accentColor: "#ff0000",
        bookingPageBackground: "grouped",
        bookingHeroOverlay: "brand",
        bookingHeroOverlayOpacity: 50,
      }),
    );
    expect(style["--booking-accent"]).toBe("#ff0000");
    expect(style["--booking-page-bg"]).toBe("#f2f2f7");
    expect(style["--booking-hero-overlay"]).toBe("#ff0000");
    expect(style["--booking-hero-overlay-opacity"]).toBe("0.5");
  });

  it("applies accent on all plans but gates extended theme on trial", () => {
    const trialTheme = resolveBookingTheme(
      {
        accentColor: "#ff6699",
        bookingPageBackground: "grouped",
        bookingHeroOverlay: "brand",
        bookingHeroOverlayOpacity: 80,
      },
      { canUseExtendedTheme: false },
    );
    expect(trialTheme.accentColor).toBe("#ff6699");
    expect(trialTheme.pageBackground).toBe("white");
    expect(trialTheme.heroOverlay).toBe("light");
  });

  it("allows extended theme on pro", () => {
    const proTheme = resolveBookingTheme(
      {
        accentColor: "#ff6699",
        bookingPageBackground: "custom",
        bookingPageBackgroundColor: "#fff6f8",
        bookingHeroOverlay: "brand",
        bookingHeroOverlayOpacity: 80,
        bookingThemePreset: "salon",
      },
      { canUseExtendedTheme: true },
    );
    expect(proTheme.pageBackground).toBe("custom");
    expect(proTheme.pageBackgroundColor).toBe("#fff6f8");
    expect(proTheme.heroOverlay).toBe("brand");
    expect(proTheme.heroOverlayOpacity).toBe(80);
  });

  it("warns on low contrast accents", () => {
    expect(accentContrastWarning("#ffffff", "#ffffff")).toContain("hard to read");
    expect(contrastRatio("#111111", "#ffffff")).toBeGreaterThan(10);
  });

  it("resolves salon preset colors for Wax-style branding", () => {
    const salon = BOOKING_THEME_PRESETS.salon;
    expect(salon.accentColor).toBe("#ff6699");
    expect(salon.pageBackground).toBe("custom");
    expect(salon.pageBackgroundColor).toBe("#fff6f8");
  });

  it("resolves salon_vivid preset with accent wash background", () => {
    const vivid = BOOKING_THEME_PRESETS.salon_vivid;
    expect(vivid.pageBackground).toBe("accent");
    const theme = resolveBookingTheme(
      { accentColor: vivid.accentColor, bookingThemePreset: "salon_vivid" },
      { canUseExtendedTheme: true },
    );
    const style = buildBookingThemeStyle(theme);
    expect(style["--booking-page-bg"]).not.toBe("#ffffff");
    expect(style["--booking-page-bg"]).not.toBe("#fff6f8");
  });

  it("resolves all theme presets with valid accent colors", () => {
    for (const [name, preset] of Object.entries(BOOKING_THEME_PRESETS)) {
      expect(preset.accentColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(["white", "grouped", "custom", "accent"]).toContain(preset.pageBackground);
      expect(name).toBeTruthy();
    }
  });
});

describe("service-slug", () => {
  it("slugifies service names", () => {
    expect(slugifyServiceName("Hair Cut & Style")).toBe("hair-cut-style");
    expect(slugifyServiceName("  Bridal  Makeup!!! ")).toBe("bridal-makeup");
  });
});
