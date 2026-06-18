"use client";

import type { BookingCopy } from "@/lib/i18n";
import type { ReviewDistribution } from "@/lib/reviews-public";
import { cn } from "@/lib/utils";
import { StarRating } from "./StarRating";

export type StarFilter = "all" | 1 | 2 | 3 | 4 | 5;

const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

interface ReviewRatingSummaryProps {
  avgRating: number;
  reviewCount: number;
  distribution: ReviewDistribution;
  activeFilter: StarFilter;
  onFilterChange: (filter: StarFilter) => void;
  copy: BookingCopy;
}

export function ReviewRatingSummary({
  avgRating,
  reviewCount,
  distribution,
  activeFilter,
  onFilterChange,
  copy,
}: ReviewRatingSummaryProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{copy.reviewsSummaryTitle}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:gap-6">
        <div className="space-y-1.5" role="radiogroup" aria-label={copy.filterReviewsByRating}>
          {STAR_LEVELS.map((stars) => {
            const starCount = distribution[stars];
            const percentage = reviewCount > 0 ? (starCount / reviewCount) * 100 : 0;
            const isActive = activeFilter === stars;

            return (
              <button
                key={stars}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={copy.filterByStars.replace("{stars}", String(stars))}
                onClick={() => onFilterChange(isActive ? "all" : stars)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-1 py-0.5 transition-colors",
                  isActive && "bg-[var(--booking-accent-muted)]/60",
                )}
              >
                <span className="w-3 shrink-0 text-xs font-medium tabular-nums text-foreground">
                  {stars}
                </span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center transition-colors sm:py-2",
            activeFilter === "all" ? "bg-muted/40" : "hover:bg-muted/30",
          )}
          aria-label={copy.allStarRatings}
        >
          <p className="font-cal text-4xl font-semibold tabular-nums leading-none text-foreground">
            {avgRating.toFixed(1)}
          </p>
          <StarRating rating={avgRating} size="md" className="mt-2" />
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            ({reviewCount.toLocaleString()})
          </p>
        </button>
      </div>

      {activeFilter !== "all" ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {copy.showingStarReviews.replace("{stars}", String(activeFilter))}{" "}
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className="font-medium text-[var(--booking-accent)] hover:underline"
          >
            {copy.clearReviewFilter}
          </button>
        </p>
      ) : null}
    </div>
  );
}
