"use client";

import { cn } from "@/lib/utils";
<<<<<<< HEAD
import { formatBookingCopy, type BookingCopy } from "@/lib/i18n";
import { shouldShowReviewCount } from "@/lib/booking/rating";

export const BOOKING_REVIEWS_SECTION_ID = "booking-reviews";

export { HIGH_RATING_THRESHOLD, shouldShowReviewCount } from "@/lib/booking/rating";
=======
import type { BookingCopy } from "@/lib/i18n";
import { NumberTicker } from "@/components/ui/number-ticker";
import { StarRating } from "./StarRating";
>>>>>>> master

interface BusinessRatingProps {
  avgRating: number;
  reviewCount: number;
  copy: BookingCopy;
  size?: "sm" | "md";
<<<<<<< HEAD
  variant?: "text" | "pill";
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
=======
  showAttribution?: boolean;
  compactAttribution?: boolean;
  animateCount?: boolean;
  className?: string;
}

function reviewLabel(copy: BookingCopy, count: number, compact?: boolean) {
  const formatted = count.toLocaleString();
  if (compact) {
    if (count === 1) return "1 review";
    return `${formatted} reviews`;
  }
  if (count === 1) return copy.reviewOnDinaya;
  return copy.reviewsOnDinaya.replace("{count}", formatted);
>>>>>>> master
}

export function BusinessRating({
  avgRating,
  reviewCount,
  copy,
  size = "sm",
<<<<<<< HEAD
  variant = "text",
  showCount,
  scrollToReviews = false,
=======
  showAttribution = true,
  compactAttribution = false,
  animateCount = false,
>>>>>>> master
  className,
}: BusinessRatingProps) {
  if (reviewCount <= 0) return null;

  const showReviewCount = shouldShowReviewCount(avgRating, showCount);
  const textClass = size === "md" ? "text-sm" : "text-xs";
  const ariaLabel = ratingAriaLabel(copy, avgRating, reviewCount, showReviewCount);

<<<<<<< HEAD
  const content = (
    <>
      <span className="text-amber-500" aria-hidden>
        ★
      </span>
      <span className={cn("tabular-nums", variant === "pill" && "text-foreground")}>
        {avgRating.toFixed(1)}
      </span>
      {showReviewCount ? (
        <>
          <span className="text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <span>{reviewCountLabel(copy, reviewCount)}</span>
        </>
=======
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <StarRating rating={avgRating} size={size} />
      {animateCount ? (
        <NumberTicker
          value={avgRating}
          decimalPlaces={1}
          className={cn("font-semibold text-foreground", scoreClass)}
        />
      ) : (
        <span className={cn("font-semibold tabular-nums text-foreground", scoreClass)}>
          {avgRating.toFixed(1)}
        </span>
      )}
      {showAttribution ? (
        <span className={cn("text-muted-foreground", scoreClass)}>
          {reviewLabel(copy, reviewCount, compactAttribution)}
        </span>
>>>>>>> master
      ) : null}
    </>
  );

  const sharedClass = cn(
    "inline-flex items-center gap-1",
    variant === "pill"
      ? "rounded-md bg-muted/70 px-1.5 py-0.5 font-medium text-muted-foreground ring-1 ring-border/40"
      : "text-muted-foreground",
    textClass,
    scrollToReviews &&
      (variant === "pill"
        ? "cursor-pointer transition-colors hover:bg-muted hover:text-foreground"
        : "cursor-pointer rounded-sm transition-colors hover:text-foreground"),
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
