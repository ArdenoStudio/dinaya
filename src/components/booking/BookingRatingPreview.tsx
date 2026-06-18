"use client";

import { BookingTheme } from "@/components/booking/BookingTheme";
import { BookingBusinessAvatar } from "@/components/booking/BookingBusinessAvatar";
import { BusinessRating } from "@/components/booking/BusinessRating";
import { getBookingCopy } from "@/lib/i18n";

const copy = getBookingCopy("en");

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function HeaderRow({
  name,
  logoUrl,
  avgRating,
  reviewCount,
}: {
  name: string;
  logoUrl?: string | null;
  avgRating: number;
  reviewCount: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <BookingBusinessAvatar name={name} logoUrl={logoUrl} className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <BusinessRating
          avgRating={avgRating}
          reviewCount={reviewCount}
          copy={copy}
          size="sm"
          scrollToReviews
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

export function BookingRatingPreview() {
  return (
    <BookingTheme accentColor="#F97316">
      <div className="booking-page-bg min-h-dvh bg-muted/20 px-4 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Booking rating preview</h1>
            <p className="mt-1 text-sm text-muted-foreground">Dev-only — cleaner header treatment</p>
          </div>

          <PreviewCard title="High rating (≥ 4.5) — score only, tap opens reviews">
            <HeaderRow name="Test" avgRating={4.7} reviewCount={1500} />
          </PreviewCard>

          <PreviewCard title="Lower rating — score and review count">
            <HeaderRow name="Colombo Cuts" avgRating={4.2} reviewCount={150} />
          </PreviewCard>

          <PreviewCard title="No logo — initials fallback">
            <HeaderRow name="Test" logoUrl={null} avgRating={4.7} reviewCount={1500} />
          </PreviewCard>

          <PreviewCard title="Reviews section pill">
            <button
              type="button"
              className="group mx-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-500" aria-hidden>
                  ★
                </span>
                <span className="tabular-nums text-foreground">4.7</span>
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                <span className="font-medium">{copy.readReviews}</span>
                <span className="tabular-nums">(1,500)</span>
              </span>
            </button>
          </PreviewCard>
        </div>
      </div>
    </BookingTheme>
  );
}
