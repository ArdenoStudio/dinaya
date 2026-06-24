import { describe, expect, it } from "vitest";
import {
  accentContrastWarning,
  buildBookingThemeStyle,
  contrastRatio,
  normalizeAccentColor,
  resolveBookingTheme,
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
        accentColor: "#f86888",
        bookingPageBackground: "grouped",
        bookingHeroOverlay: "brand",
        bookingHeroOverlayOpacity: 80,
      },
      { canUseExtendedTheme: false },
    );
    expect(trialTheme.accentColor).toBe("#f86888");
    expect(trialTheme.pageBackground).toBe("white");
    expect(trialTheme.heroOverlay).toBe("light");
  });

  it("allows extended theme on pro", () => {
    const proTheme = resolveBookingTheme(
      {
        accentColor: "#f86888",
        bookingPageBackground: "grouped",
        bookingHeroOverlay: "brand",
        bookingHeroOverlayOpacity: 80,
      },
      { canUseExtendedTheme: true },
    );
    expect(proTheme.pageBackground).toBe("grouped");
    expect(proTheme.heroOverlay).toBe("brand");
    expect(proTheme.heroOverlayOpacity).toBe(80);
  });

  it("warns on low contrast accents", () => {
    expect(accentContrastWarning("#ffffff", "#ffffff")).toContain("hard to read");
    expect(contrastRatio("#111111", "#ffffff")).toBeGreaterThan(10);
  });
});

describe("service-slug", () => {
  it("slugifies service names", () => {
    expect(slugifyServiceName("Hair Cut & Style")).toBe("hair-cut-style");
    expect(slugifyServiceName("  Bridal  Makeup!!! ")).toBe("bridal-makeup");
  });
});
