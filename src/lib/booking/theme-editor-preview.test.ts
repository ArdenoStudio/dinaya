import { describe, expect, it } from "vitest";
import {
  buildThemeEditorPreviewUrl,
  parseBookingContentPreviewParams,
} from "@/lib/booking/theme-editor-preview";

describe("theme-editor-preview", () => {
  it("builds preview URLs with theme and content overrides", () => {
    const url = buildThemeEditorPreviewUrl("wax-in-the-city", {
      accentColor: "#ff46a2",
      bookingPageBackground: "accent",
      bookingPageBackgroundColor: "#fff6f8",
      bookingPanelBackground: "accent",
      bookingHeroOverlay: "brand",
      bookingHeroOverlayOpacity: 55,
      logoUrl: "https://cdn.example/logo.png",
      heroBannerUrl: "https://cdn.example/hero.jpg",
      galleryRest: ["https://cdn.example/g1.jpg"],
      hideDinayaBranding: true,
    });

    const parsed = new URL(url, "https://example.test");
    expect(parsed.pathname).toBe("/embed/book/wax-in-the-city");
    expect(parsed.searchParams.get("previewAccent")).toBe("#ff46a2");
    expect(parsed.searchParams.get("previewLogo")).toBe("https://cdn.example/logo.png");
    expect(parsed.searchParams.get("previewGallery")).toBe(
      "https://cdn.example/hero.jpg|https://cdn.example/g1.jpg",
    );
    expect(parsed.searchParams.get("previewHideBranding")).toBe("1");
  });

  it("parses content preview params from embed query strings", () => {
    const params = new URLSearchParams({
      previewLogo: "https://cdn.example/logo.png",
      previewGallery: "https://cdn.example/hero.jpg|https://cdn.example/g2.jpg",
      previewHideBranding: "1",
    });
    const overrides = parseBookingContentPreviewParams(params);
    expect(overrides?.logoUrl).toBe("https://cdn.example/logo.png");
    expect(overrides?.galleryImages).toEqual([
      "https://cdn.example/hero.jpg",
      "https://cdn.example/g2.jpg",
    ]);
    expect(overrides?.hideDinayaBranding).toBe(true);
  });
});
