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
  expanded?: boolean;
}

export function ReviewRatingSummary({
  avgRating,
  reviewCount,
  distribution,
  activeFilter,
  onFilterChange,
  copy,
  expanded = true,
}: ReviewRatingSummaryProps) {
  if (!expanded) {
    return (
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={avgRating} size="sm" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{avgRating.toFixed(1)}</span>
          {" · "}
          {copy.reviewsOnDinaya.replace("{count}", reviewCount.toLocaleString())}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:items-center">
      <div className="space-y-2" role="radiogroup" aria-label={copy.filterReviewsByRating}>
        <button
          type="button"
          role="radio"
          aria-checked={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
          className={cn(
            "mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors",
            activeFilter === "all"
              ? "bg-[var(--booking-accent-muted)] text-[var(--booking-accent)]"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {copy.allStarRatings} ({reviewCount.toLocaleString()})
        </button>

        {STAR_LEVELS.map((stars) => {
          const starCount = distribution[stars];
          const percentage = reviewCount > 0 ? Math.round((starCount / reviewCount) * 100) : 0;
          const isActive = activeFilter === stars;

          return (
            <button
              key={stars}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={copy.filterByStars.replace("{stars}", String(stars))}
              onClick={() => onFilterChange(stars)}
              className={cn(
                "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                isActive ? "bg-[var(--booking-accent-muted)]/80" : "hover:bg-muted/50",
              )}
            >
              <span className="w-3 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {stars}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {starCount.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 px-3 py-4 text-center sm:py-2">
        <p className="font-cal text-4xl font-semibold tabular-nums leading-none text-foreground">
          {avgRating.toFixed(1)}
        </p>
        <StarRating rating={avgRating} size="md" className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">({reviewCount.toLocaleString()})</p>
      </div>
    </div>
  );
}
