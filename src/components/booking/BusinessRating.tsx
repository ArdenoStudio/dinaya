import { cn } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";
import { NumberTicker } from "@/components/ui/number-ticker";
import { StarRating } from "./StarRating";

interface BusinessRatingProps {
  avgRating: number;
  reviewCount: number;
  copy: BookingCopy;
  size?: "sm" | "md";
  showAttribution?: boolean;
  animateCount?: boolean;
  className?: string;
}

function reviewLabel(copy: BookingCopy, count: number) {
  const formatted = count.toLocaleString();
  if (count === 1) return copy.reviewOnDinaya;
  return copy.reviewsOnDinaya.replace("{count}", formatted);
}

export function BusinessRating({
  avgRating,
  reviewCount,
  copy,
  size = "sm",
  showAttribution = true,
  animateCount = false,
  className,
}: BusinessRatingProps) {
  if (reviewCount <= 0) return null;

  const scoreClass = size === "md" ? "text-sm" : "text-xs";

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
          {reviewLabel(copy, reviewCount)}
        </span>
      ) : null}
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
