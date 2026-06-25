"use client";

import { useMemo, useState } from "react";
import { BookingPageThemeEditor } from "@/components/dashboard/BookingPageThemeEditor";

type ThemeBusiness = {
  accentColor: string | null;
  bookingPageBackground: string;
  bookingPageBackgroundColor: string | null;
  bookingHeroOverlay: string;
  bookingHeroOverlayOpacity: number;
  bookingThemePreset: string | null;
  bookingPanelBackground: string;
  canUseBookingPageTheme: boolean;
  canCustomizeBookingPage: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
  description: string | null;
  galleryImages: string[] | null;
  hideDinayaBranding: boolean;
  logoUrl: string | null;
  name: string;
  slug: string;
};

export function BookingPageEditor({ business }: { business: ThemeBusiness }) {
  const initialPreview = useMemo(
    () => `/embed/book/${business.slug}?embed=1&hideGallery=0`,
    [business.slug],
  );
  const [previewSrc, setPreviewSrc] = useState(initialPreview);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <BookingPageThemeEditor business={business} onPreviewChange={setPreviewSrc} />
      <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 xl:sticky xl:top-6 xl:self-start">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Live preview</h2>
          <span className="text-xs text-muted-foreground">Updates as you edit</span>
        </div>
        <iframe
          key={previewSrc}
          src={previewSrc}
          title="Booking page preview"
          className="h-[min(80vh,900px)] w-full rounded-lg border"
        />
      </div>
    </div>
  );
}
