export type PublicReviewsQuery = {
  page: number;
  limit: number;
  offset: number;
  rating?: number;
};

const MAX_REVIEW_PAGE = 500;
const MAX_REVIEW_LIMIT = 50;

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number | null {
  if (value == null || value === "") return fallback;
  if (!/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

export function parsePublicReviewsQuery(
  searchParams: URLSearchParams,
): PublicReviewsQuery | null {
  const page = parseBoundedInteger(
    searchParams.get("page"),
    1,
    1,
    MAX_REVIEW_PAGE,
  );
  const limit = parseBoundedInteger(
    searchParams.get("limit"),
    20,
    1,
    MAX_REVIEW_LIMIT,
  );
  const rating = parseBoundedInteger(searchParams.get("rating"), 0, 1, 5);

  if (page == null || limit == null || rating == null) return null;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    ...(rating > 0 ? { rating } : {}),
  };
}
