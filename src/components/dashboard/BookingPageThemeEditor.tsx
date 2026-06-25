"use client";

import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { buildPublicBookingUrl } from "@/lib/booking-url";
import {
  BOOKING_THEME_PRESETS,
  accentContrastWarning,
  tintAccentBackground,
  type BookingHeroOverlay,
  type BookingPageBackground,
  type BookingPanelBackground,
  type BookingThemePreset,
} from "@/lib/booking-theme";
import Link from "next/link";
import Image from "next/image";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { dashboardInputClass } from "@/lib/dashboard-ui";

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

interface Props {
  business: ThemeBusiness;
  onPreviewChange: (previewSrc: string) => void;
}

const PRESET_LABELS: Record<Exclude<BookingThemePreset, "custom">, string> = {
  classic: "Classic",
  salon: "Salon (soft)",
  salon_vivid: "Salon (vivid)",
  spa: "Spa calm",
  bold: "Bold",
};

const HERO_OVERLAY_OPTIONS: { value: BookingHeroOverlay; label: string }[] = [
  { value: "light", label: "Light fade" },
  { value: "dark", label: "Dark fade" },
  { value: "brand", label: "Brand tint" },
  { value: "none", label: "None" },
];

const PAGE_BACKGROUND_OPTIONS: { value: BookingPageBackground; label: string }[] = [
  { value: "white", label: "White" },
  { value: "grouped", label: "Soft gray" },
  { value: "custom", label: "Custom color" },
  { value: "accent", label: "Accent wash" },
];

const PANEL_BACKGROUND_OPTIONS: { value: BookingPanelBackground; label: string }[] = [
  { value: "white", label: "White card" },
  { value: "accent", label: "Brand accent panel" },
];

function buildPreviewUrl(
  slug: string,
  values: {
    accentColor: string;
    bookingPageBackground: BookingPageBackground;
    bookingPageBackgroundColor: string;
    bookingPanelBackground: BookingPanelBackground;
    bookingHeroOverlay: BookingHeroOverlay;
    bookingHeroOverlayOpacity: number;
  },
): string {
  const params = new URLSearchParams({
    embed: "1",
    hideGallery: "0",
    previewAccent: values.accentColor,
    previewPageBg: values.bookingPageBackground,
    previewPanelBg: values.bookingPanelBackground,
    previewHeroOverlay: values.bookingHeroOverlay,
    previewHeroOpacity: String(values.bookingHeroOverlayOpacity),
  });
  if (values.bookingPageBackground === "custom" && values.bookingPageBackgroundColor) {
    params.set("previewPageBgColor", values.bookingPageBackgroundColor);
  }
  return `/embed/book/${slug}?${params.toString()}`;
}

export function BookingPageThemeEditor({ business, onPreviewChange }: Props) {
  const bookingUrl = buildPublicBookingUrl({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });

  const [form, setForm] = useState({
    accentColor: business.accentColor ?? "#2563eb",
    bookingPageBackground: (business.bookingPageBackground || "white") as BookingPageBackground,
    bookingPageBackgroundColor: business.bookingPageBackgroundColor ?? "#f2f2f7",
    bookingPanelBackground: (business.bookingPanelBackground || "white") as BookingPanelBackground,
    bookingHeroOverlay: (business.bookingHeroOverlay || "light") as BookingHeroOverlay,
    bookingHeroOverlayOpacity: business.bookingHeroOverlayOpacity ?? 60,
    bookingThemePreset: (business.bookingThemePreset ?? "custom") as BookingThemePreset,
    hideDinayaBranding: business.hideDinayaBranding,
  });
  const [logoUrl, setLogoUrl] = useState(business.logoUrl ?? "");
  const [heroBannerUrl, setHeroBannerUrl] = useState(business.galleryImages?.[0] ?? "");
  const [galleryRest, setGalleryRest] = useState<string[]>(business.galleryImages?.slice(1) ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const galleryImageCount = [heroBannerUrl.trim(), ...galleryRest].filter(Boolean).length;
  const galleryAtLimit = galleryImageCount >= 12;

  const contrastWarning = accentContrastWarning(
    form.accentColor,
    form.bookingPanelBackground === "accent"
      ? tintAccentBackground(form.accentColor, 0.48)
      : form.bookingPageBackground === "custom"
      ? form.bookingPageBackgroundColor
      : form.bookingPageBackground === "grouped"
        ? "#f2f2f7"
        : form.bookingPageBackground === "accent"
          ? tintAccentBackground(form.accentColor, 0.38)
          : "#ffffff",
  );

  useEffect(() => {
    updatePreview(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial preview only
  }, []);

  function updatePreview(next: typeof form) {
    onPreviewChange(
      buildPreviewUrl(business.slug, {
        accentColor: next.accentColor,
        bookingPageBackground: next.bookingPageBackground,
        bookingPageBackgroundColor: next.bookingPageBackgroundColor,
        bookingPanelBackground: next.bookingPanelBackground,
        bookingHeroOverlay: next.bookingHeroOverlay,
        bookingHeroOverlayOpacity: next.bookingHeroOverlayOpacity,
      }),
    );
  }

  function applyPreset(preset: Exclude<BookingThemePreset, "custom">) {
    const values = BOOKING_THEME_PRESETS[preset];
    const next = {
      ...form,
      bookingPageBackground: values.pageBackground,
      bookingPageBackgroundColor: values.pageBackgroundColor ?? "#f2f2f7",
      bookingPanelBackground: values.panelBackground ?? "white",
      bookingHeroOverlay: values.heroOverlay,
      bookingHeroOverlayOpacity: values.heroOverlayOpacity,
      bookingThemePreset: preset,
    };
    setForm(next);
    updatePreview(next);
  }

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    const next = { ...form, [key]: value, bookingThemePreset: "custom" as const };
    setForm(next);
    updatePreview(next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const galleryImages = [heroBannerUrl.trim(), ...galleryRest].filter(Boolean);
    const payload = {
      accentColor: form.accentColor,
      bookingPageBackground: form.bookingPageBackground,
      bookingPageBackgroundColor:
        form.bookingPageBackground === "custom" ? form.bookingPageBackgroundColor : null,
      bookingPanelBackground: form.bookingPanelBackground,
      bookingHeroOverlay: form.bookingHeroOverlay,
      bookingHeroOverlayOpacity: form.bookingHeroOverlayOpacity,
      bookingThemePreset: form.bookingThemePreset,
      hideDinayaBranding: form.hideDinayaBranding,
      logoUrl: logoUrl.trim() || null,
      galleryImages,
      name: business.name,
      description: business.description,
    };

    const res = await fetch("/api/dashboard/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error saving.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-xl border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Icon name="image" className="text-sm text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identity</p>
        </div>
        <div className="mt-4 space-y-6">
          <ImageUploadField
            label="Logo"
            hint="Shown in the header and on your booking page."
            value={logoUrl}
            onChange={setLogoUrl}
            kind="logo"
            aspectRatio={1}
            outputWidth={512}
            previewShape="circle"
          />
          <ImageUploadField
            label="Hero banner"
            hint="The wide image at the top of your booking page."
            value={heroBannerUrl}
            onChange={setHeroBannerUrl}
            kind="banner"
            aspectRatio={16 / 9}
            outputWidth={1600}
            previewShape="wide"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Icon name="palette" className="text-sm text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Colors</p>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Accent color</label>
            <p className="mt-1 text-xs text-muted-foreground">Buttons, selected services, and time slots.</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => updateForm("accentColor", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) => updateForm("accentColor", e.target.value)}
                className={`${dashboardInputClass} max-w-[8rem] font-mono`}
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
            {contrastWarning ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{contrastWarning}</p>
            ) : (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Contrast looks good.</p>
            )}
          </div>

          {business.canUseBookingPageTheme ? (
            <>
              <div>
                <label className="text-sm font-medium">Theme presets</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(PRESET_LABELS) as Array<Exclude<BookingThemePreset, "custom">>).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        form.bookingThemePreset === preset
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Page background</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PAGE_BACKGROUND_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm("bookingPageBackground", option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        form.bookingPageBackground === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {form.bookingPageBackground === "custom" ? (
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={form.bookingPageBackgroundColor}
                      onChange={(e) => updateForm("bookingPageBackgroundColor", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border bg-white p-1"
                    />
                    <input
                      type="text"
                      value={form.bookingPageBackgroundColor}
                      onChange={(e) => updateForm("bookingPageBackgroundColor", e.target.value)}
                      className={`${dashboardInputClass} max-w-[8rem] font-mono`}
                    />
                  </div>
                ) : null}
              </div>

              {form.bookingPageBackground === "accent" ? (
                <div>
                  <label className="text-sm font-medium">Content panel</label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a white card on the accent page, or a darker brand panel with a lighter page
                    background.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PANEL_BACKGROUND_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateForm("bookingPanelBackground", option.value)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          form.bookingPanelBackground === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium">Hero overlay</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HERO_OVERLAY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm("bookingHeroOverlay", option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        form.bookingHeroOverlay === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-sm font-medium">
                  Overlay strength ({form.bookingHeroOverlayOpacity}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.bookingHeroOverlayOpacity}
                  onChange={(e) => updateForm("bookingHeroOverlayOpacity", Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-4 text-sm dark:border-violet-900 dark:bg-violet-950/30">
              <p className="font-medium text-violet-950 dark:text-violet-100">Page background & hero overlay</p>
              <p className="mt-1 text-violet-900/75 dark:text-violet-200/80">
                Upgrade to Pro for background colors, hero overlays, and theme presets.
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-3 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
              >
                View plan options
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Icon name="images" className="text-sm text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gallery</p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Optional extra photos below the hero banner. Upload from your device or paste a URL.
        </p>
        {galleryRest.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {galleryRest.map((url) => (
              <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted/20">
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized={!isOptimizableRemoteImage(url)}
                />
                <button
                  type="button"
                  onClick={() => setGalleryRest((prev) => prev.filter((item) => item !== url))}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Icon name="x-lg" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-3">
          <ImageUploadField
            label="Add gallery photo"
            hint={`${galleryImageCount}/12 photos`}
            value=""
            onChange={(url) => {
              if (!url || galleryRest.includes(url) || galleryAtLimit) return;
              setGalleryRest((prev) => [...prev, url]);
            }}
            kind="gallery"
            aspectRatio={4 / 3}
            outputWidth={1200}
            previewShape="wide"
            allowUrl
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <Icon name="person-badge" className="text-sm text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Footer</p>
        </div>
        {business.canCustomizeBookingPage ? (
          <label className="mt-4 flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.hideDinayaBranding}
              onChange={(e) => updateForm("hideDinayaBranding", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Remove Dinaya branding</span>
          </label>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Upgrade to Growth to remove the Dinaya footer and use a custom domain.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving} className="min-h-11">
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
          Open live page
        </a>
      </div>
    </form>
  );
}
