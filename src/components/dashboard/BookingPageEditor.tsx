"use client";

import { useMemo, useState } from "react";
import { BookingPagePreviewPanel } from "@/components/dashboard/BookingPagePreviewPanel";
import { BookingPageThemeEditor } from "@/components/dashboard/BookingPageThemeEditor";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildThemeEditorPreviewUrl } from "@/lib/booking/theme-editor-preview";
import { buildPublicBookingUrl } from "@/lib/booking-url";
import { cn } from "@/lib/utils";

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
  const bookingUrl = buildPublicBookingUrl({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });

  const initialPreview = useMemo(
    () =>
      buildThemeEditorPreviewUrl(business.slug, {
        accentColor: business.accentColor ?? "#2563eb",
        bookingPageBackground: (business.bookingPageBackground || "white") as "white",
        bookingPageBackgroundColor: business.bookingPageBackgroundColor ?? "#f2f2f7",
        bookingPanelBackground: (business.bookingPanelBackground || "white") as "white",
        bookingHeroOverlay: (business.bookingHeroOverlay || "light") as "light",
        bookingHeroOverlayOpacity: business.bookingHeroOverlayOpacity ?? 60,
        logoUrl: business.logoUrl ?? "",
        heroBannerUrl: business.galleryImages?.[0] ?? "",
        galleryRest: business.galleryImages?.slice(1) ?? [],
        hideDinayaBranding: business.hideDinayaBranding,
      }),
    [business],
  );

  const [previewSrc, setPreviewSrc] = useState(initialPreview);
  const [accentColor, setAccentColor] = useState(business.accentColor ?? "#2563eb");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");

  return (
    <div className="space-y-4">
      <div className="xl:hidden">
        <ToggleGroup
          value={[mobilePane]}
          onValueChange={(values) => {
            const next = values[values.length - 1];
            if (next === "edit" || next === "preview") setMobilePane(next);
          }}
          variant="outline"
          className="w-full"
        >
          <ToggleGroupItem value="edit" className="min-h-11 flex-1">
            Edit
          </ToggleGroupItem>
          <ToggleGroupItem value="preview" className="min-h-11 flex-1">
            Preview
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className={cn(mobilePane === "preview" && "hidden xl:block")}>
          <BookingPageThemeEditor
            business={business}
            onPreviewChange={(src) => {
              setPreviewSrc(src);
              const accent = new URL(src, "http://localhost").searchParams.get("previewAccent");
              if (accent) setAccentColor(accent);
            }}
          />
        </div>
        <div className={cn(mobilePane === "edit" && "hidden xl:block")}>
          <BookingPagePreviewPanel
            previewSrc={previewSrc}
            accentColor={accentColor}
            bookingUrl={bookingUrl}
          />
        </div>
      </div>
    </div>
  );
}
