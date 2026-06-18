export const HIGH_RATING_THRESHOLD = 4.5;

export function shouldShowReviewCount(avgRating: number, showCount?: boolean) {
  return showCount ?? avgRating < HIGH_RATING_THRESHOLD;
}

export function getBusinessRating(
  avgRating: number | null | undefined,
  reviewCount: number | null | undefined,
): { avgRating: number; reviewCount: number } | null {
  if (avgRating == null || reviewCount == null || reviewCount <= 0) return null;
  return { avgRating, reviewCount };
}
