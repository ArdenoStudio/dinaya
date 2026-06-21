"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";
import type { PublicReview, ReviewDistribution } from "@/lib/reviews-public";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ReviewRatingSummary, type StarFilter } from "./ReviewRatingSummary";
import { StarRating } from "./StarRating";
import { BusinessRating } from "./BusinessRating";

const PAGE_SIZE = 20;

export type SerializedPublicReview = Omit<PublicReview, "createdAt"> & { createdAt: string };

interface Props {
  businessSlug: string;
  businessName: string;
  avgRating: number;
  reviewCount: number;
  reviewDistribution: ReviewDistribution;
  initialReviews: SerializedPublicReview[];
  copy: BookingCopy;
  className?: string;
  id?: string;
  variant?: "pill" | "rating";
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reviewsUrl(slug: string, page: number, filter: StarFilter) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (filter !== "all") params.set("rating", String(filter));
  return `/api/public/reviews/${encodeURIComponent(slug)}?${params.toString()}`;
}

export function BookingReviewsSection({
  businessSlug,
  businessName,
  avgRating,
  reviewCount,
  reviewDistribution,
  initialReviews,
  copy,
  className,
  id,
  variant = "pill",
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialReviews.length < reviewCount);
  const [loading, setLoading] = useState(false);
  const [starFilter, setStarFilter] = useState<StarFilter>("all");

  const resetDialogState = useCallback(() => {
    setStarFilter("all");
    setReviews(initialReviews);
    setPage(1);
    setHasMore(initialReviews.length < reviewCount);
    setLoading(false);
  }, [initialReviews, reviewCount]);

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
  };

  const closeDialog = () => dialogRef.current?.close();

  async function fetchReviews(nextPage: number, filter: StarFilter, append: boolean) {
    setLoading(true);
    try {
      const res = await fetch(reviewsUrl(businessSlug, nextPage, filter));
      if (!res.ok) return;
      const data = (await res.json()) as {
        reviews: SerializedPublicReview[];
        hasMore: boolean;
      };
      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
      setPage(nextPage);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterChange(filter: StarFilter) {
    if (filter === starFilter || loading) return;
    setStarFilter(filter);
    await fetchReviews(1, filter, false);
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    await fetchReviews(page + 1, starFilter, true);
  }

  return (
    <BlurFade inView className={className}>
      <div
        id={id}
        className={cn(
          "mx-auto flex w-full max-w-3xl",
          variant === "rating" ? "justify-center px-0" : "justify-center px-4",
        )}
      >
        {variant === "rating" ? (
          <button
            type="button"
            onClick={openDialog}
            className="group inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)]"
            aria-label={copy.readReviews}
          >
            <BusinessRating
              avgRating={avgRating}
              reviewCount={reviewCount}
              copy={copy}
              size="sm"
              compactAttribution
            />
            <Icon
              name="chevron-right"
              className="text-xs text-muted-foreground opacity-60 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </button>
        ) : (
        <button
          type="button"
          onClick={openDialog}
          className="group flex min-h-11 items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out hover:border-border hover:bg-card hover:text-foreground hover:shadow active:scale-[0.99]"
        >
          <span className="flex items-center gap-2">
            <StarRating rating={avgRating} size="sm" />
            <NumberTicker
              value={avgRating}
              decimalPlaces={1}
              className="text-sm font-semibold text-foreground"
              aria-label={avgRating.toFixed(1)}
            />
          </span>
          <span className="font-medium">
            {copy.readReviews}
            <span className="ml-1 font-normal text-muted-foreground">
              (
              <NumberTicker
                value={reviewCount}
                className="text-muted-foreground"
                aria-label={String(reviewCount)}
              />
              )
            </span>
          </span>
          <Icon
            name="chevron-right"
            className="text-xs opacity-50 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </button>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 hidden max-h-[min(92dvh,44rem)] w-[min(100vw-2rem,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        onClose={resetDialogState}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{copy.reviewsTitle}</h2>
            <Button type="button" variant="ghost" size="icon-xs" onClick={closeDialog} aria-label={copy.close}>
              <Icon name="x-lg" />
            </Button>
          </div>

          <ReviewRatingSummary
            avgRating={avgRating}
            reviewCount={reviewCount}
            distribution={reviewDistribution}
            activeFilter={starFilter}
            onFilterChange={(filter) => void handleFilterChange(filter)}
            copy={copy}
          />
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {reviews.length === 0 && !loading ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              {copy.noReviewsForFilter}
            </li>
          ) : (
            reviews.map((review) => (
              <li key={review.id} className="rounded-xl px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{review.clientName}</p>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="shrink-0 text-[11px] text-muted-foreground">
                    {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                ) : null}
                {review.ownerReply ? (
                  <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-xs font-medium text-foreground">
                      {copy.responseFrom.replace("{business}", businessName)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.ownerReply}</p>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>

        {hasMore ? (
          <div className="border-t border-border px-4 py-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => void loadMore()}
            >
              {loading ? copy.loadingReviews : copy.loadMoreReviews}
            </Button>
          </div>
        ) : null}
      </dialog>
    </BlurFade>
  );
}
