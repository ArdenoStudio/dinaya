"use client";

import { cn } from "@/lib/utils";
import { formatBookingCopy, type BookingCopy } from "@/lib/i18n";

export const BOOKING_REVIEWS_SECTION_ID = "booking-reviews";
export const HIGH_RATING_THRESHOLD = 4.5;

interface BusinessRatingProps {
  avgRating: number;
  reviewCount: number;
  copy: BookingCopy;
  size?: "sm" | "md";
  /** When omitted, counts are hidden for ratings at or above {@link HIGH_RATING_THRESHOLD}. */
  showCount?: boolean;
  scrollToReviews?: boolean;
  className?: string;
}

function reviewCountLabel(copy: BookingCopy, count: number) {
  const formatted = count.toLocaleString();
  if (count === 1) return copy.reviewCountSingular;
  return formatBookingCopy(copy.reviewsCount, { count: formatted });
}

function ratingAriaLabel(copy: BookingCopy, avgRating: number, reviewCount: number, showCount: boolean) {
  const rating = avgRating.toFixed(1);
  if (!showCount) {
    return formatBookingCopy(copy.ratingSummaryHighAria, { rating });
  }
  const count = reviewCount.toLocaleString();
  return formatBookingCopy(copy.ratingSummaryAria, { rating, count });
}

export function scrollToBookingReviews() {
  const section = document.getElementById(BOOKING_REVIEWS_SECTION_ID);
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    section.querySelector<HTMLButtonElement>("[data-reviews-trigger]")?.click();
  }, 350);
}

export function BusinessRating({
  avgRating,
  reviewCount,
  copy,
  size = "sm",
  showCount,
  scrollToReviews = false,
  className,
}: BusinessRatingProps) {
  if (reviewCount <= 0) return null;

  const isHighRating = avgRating >= HIGH_RATING_THRESHOLD;
  const showReviewCount = showCount ?? !isHighRating;
  const textClass = size === "md" ? "text-sm" : "text-xs";
  const ariaLabel = ratingAriaLabel(copy, avgRating, reviewCount, showReviewCount);

  const content = (
    <>
      <span className="text-amber-500" aria-hidden>
        ★
      </span>
      <span className="tabular-nums">{avgRating.toFixed(1)}</span>
      {showReviewCount ? (
        <>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span>{reviewCountLabel(copy, reviewCount)}</span>
        </>
      ) : null}
    </>
  );

  const sharedClass = cn(
    "inline-flex items-center gap-1 text-muted-foreground",
    textClass,
    scrollToReviews && "cursor-pointer rounded-sm transition-colors hover:text-foreground",
    className,
  );

  if (scrollToReviews) {
    return (
      <button type="button" onClick={scrollToBookingReviews} className={sharedClass} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClass} aria-label={ariaLabel}>
      {content}
    </div>
  );
}

export function getBusinessRating(
  avgRating: number | null | undefined,
  reviewCount: number | null | undefined,
): { avgRating: number; reviewCount: number } | null {
  if (avgRating == null || reviewCount == null || reviewCount <= 0) return null;
  return { avgRating, reviewCount };
}
