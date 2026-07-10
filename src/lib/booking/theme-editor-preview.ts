import type {
  BookingHeroOverlay,
  BookingPageBackground,
  BookingPanelBackground,
} from "@/lib/booking-theme";

export type ThemeEditorPreviewState = {
  accentColor: string;
  bookingPageBackground: BookingPageBackground;
  bookingPageBackgroundColor: string;
  bookingPanelBackground: BookingPanelBackground;
  bookingHeroOverlay: BookingHeroOverlay;
  bookingHeroOverlayOpacity: number;
  logoUrl: string;
  heroBannerUrl: string;
  galleryRest: string[];
  hideDinayaBranding: boolean;
};

export type BookingContentPreviewOverrides = Partial<{
  logoUrl: string | null;
  galleryImages: string[] | null;
  hideDinayaBranding: boolean;
}>;

export function buildThemeEditorPreviewUrl(
  slug: string,
  state: ThemeEditorPreviewState,
): string {
  const params = new URLSearchParams({
    embed: "1",
    hideGallery: "0",
    previewAccent: state.accentColor,
    previewPageBg: state.bookingPageBackground,
    previewPanelBg: state.bookingPanelBackground,
    previewHeroOverlay: state.bookingHeroOverlay,
    previewHeroOpacity: String(state.bookingHeroOverlayOpacity),
  });

  if (state.bookingPageBackground === "custom" && state.bookingPageBackgroundColor) {
    params.set("previewPageBgColor", state.bookingPageBackgroundColor);
  }

  const trimmedLogo = state.logoUrl.trim();
  if (trimmedLogo) params.set("previewLogo", trimmedLogo);

  const galleryImages = [state.heroBannerUrl.trim(), ...state.galleryRest].filter(Boolean);
  if (galleryImages.length > 0) {
    params.set("previewGallery", galleryImages.join("|"));
  }

  if (state.hideDinayaBranding) {
    params.set("previewHideBranding", "1");
  }

  return `/embed/book/${slug}?${params.toString()}`;
}

export function parseBookingContentPreviewParams(
  searchParams: URLSearchParams,
): BookingContentPreviewOverrides | null {
  const logoUrl = searchParams.get("previewLogo");
  const galleryRaw = searchParams.get("previewGallery");
  const hideBranding = searchParams.get("previewHideBranding");

  if (!logoUrl && !galleryRaw && !hideBranding) return null;

  const overrides: BookingContentPreviewOverrides = {};
  if (logoUrl) overrides.logoUrl = logoUrl;
  if (galleryRaw) {
    overrides.galleryImages = galleryRaw.split("|").map((item) => item.trim()).filter(Boolean);
  }
  if (hideBranding === "1" || hideBranding === "true") {
    overrides.hideDinayaBranding = true;
  }

  return overrides;
}
