"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useDashboardCopy } from "@/components/dashboard/DashboardLocaleProvider";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import {
  dashboardCardClass,
  dashboardInputClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionMutedClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
};

type ReviewsSummary = {
  averageRating: number;
  publishedReviews: number;
  totalReviews: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name={n <= rating ? "star-fill" : "star"} className={`${n <= rating ? "text-amber-400" : "text-gray-300"} text-xs`} />
      ))}
    </span>
  );
}

export function ReviewsClient({ canUseAiReplies }: { canUseAiReplies: boolean }) {
  const copy = useDashboardCopy().reviews;
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [generatingReplyId, setGeneratingReplyId] = useState<string | null>(null);
  const [savedReplyId, setSavedReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/reviews")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Could not load reviews.");
        }
        const fetchedReviews: Review[] = Array.isArray(data) ? data : data.reviews;
        if (!Array.isArray(fetchedReviews)) {
          throw new Error("Could not load reviews.");
        }
        setReviewList(fetchedReviews);
        setHasMore(Boolean(data.hasMore));
        setCursor(data.nextCursor ?? null);
        setSummary(data.summary ?? null);
        setReplyDrafts(Object.fromEntries(fetchedReviews.map((review) => [review.id, review.ownerReply ?? ""])));
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Could not load reviews.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadMoreReviews() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/dashboard/reviews?cursor=${encodeURIComponent(cursor)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Could not load more reviews.");
      const fetchedReviews: Review[] = Array.isArray(data) ? data : data.reviews;
      setReviewList((prev) => [...prev, ...fetchedReviews]);
      setReplyDrafts((prev) => ({
        ...prev,
        ...Object.fromEntries(fetchedReviews.map((review) => [review.id, review.ownerReply ?? ""])),
      }));
      setHasMore(Boolean(data.hasMore));
      setCursor(data.nextCursor ?? null);
    } catch {
      // Non-fatal — the existing list stays usable; the button just stays clickable to retry.
    } finally {
      setLoadingMore(false);
    }
  }

  async function togglePublished(id: string, current: boolean) {
    const response = await fetch(`/api/dashboard/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    if (response.ok) {
      const updated = await response.json() as Review;
      setReviewList((prev) => prev.map((review) => review.id === id ? updated : review));
    }
  }

  async function deleteReview(id: string) {
    const response = await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE" });
    if (response.ok) setReviewList((prev) => prev.filter((review) => review.id !== id));
  }

  async function saveReply(id: string) {
    setSavingReplyId(id);
    const response = await fetch(`/api/dashboard/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerReply: replyDrafts[id] ?? "" }),
    });
    if (response.ok) {
      const updated = await response.json() as Review;
      setReviewList((prev) => prev.map((review) => review.id === id ? updated : review));
      setSavedReplyId(id);
      setTimeout(() => setSavedReplyId(null), 2000);
    }
    setSavingReplyId(null);
  }

  async function generateReply(id: string) {
    setGeneratingReplyId(id);
    const response = await fetch(`/api/dashboard/reviews/${id}/generate-reply`, { method: "POST" });
    const data = await response.json().catch(() => ({})) as { reply?: string; error?: string };
    if (response.ok && data.reply) {
      setReplyDrafts((prev) => ({ ...prev, [id]: data.reply! }));
      setActiveReplyId(id);
    }
    setGeneratingReplyId(null);
  }

  // Prefer the server's true aggregate (covers every review, not just the
  // pages loaded so far) — falls back to the loaded subset only if it's
  // somehow missing, so the stats never go blank.
  const totalReviews = summary?.totalReviews ?? reviewList.length;
  const published = summary?.publishedReviews ?? reviewList.filter((review) => review.isPublished).length;
  const avgRating = summary
    ? summary.averageRating.toFixed(1)
    : reviewList.length
      ? (reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length).toFixed(1)
      : null;

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader title={copy.title} description={copy.subtitle} />

      {reviewList.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(dashboardCardClass, "p-4 text-center")}>
            <p className="font-cal text-2xl">{totalReviews}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.totalReviews}</p>
          </div>
          <div className={cn(dashboardCardClass, "p-4 text-center")}>
            <p className="font-cal text-2xl">{avgRating}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.averageRating}</p>
          </div>
          <div className={cn(dashboardCardClass, "p-4 text-center")}>
            <p className="font-cal text-2xl">{published}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.published}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : loadError ? (
        <div className={cn(dashboardSectionMutedClass, "text-center")}>
          <p className="text-sm text-destructive">{loadError}</p>
        </div>
      ) : reviewList.length === 0 ? (
        <div className={cn(dashboardCardClass, "p-12 text-center")}>
          <Icon name="star" className="mb-3 block text-3xl text-muted-foreground/40" />
          <p className="text-sm font-medium">{copy.emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.emptyBody}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <div key={review.id} className={cn(dashboardCardClass, "p-5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{review.clientName}</p>
                  <Stars rating={review.rating} />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment ?? <em className="text-xs">{copy.noComment}</em>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "d MMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePublished(review.id, review.isPublished)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${review.isPublished ? "bg-primary" : "bg-gray-200 dark:bg-neutral-700"}`}
                    aria-label={copy.visible}
                  >
                    <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${review.isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <ConfirmDialog
                    title="Delete review"
                    description="Delete this review? This cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => deleteReview(review.id)}
                    trigger={
                      <button
                        type="button"
                        className="text-sm text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Delete review"
                      >
                        <Icon name="trash" />
                      </button>
                    }
                  />
                </div>
              </div>

              {review.ownerReply ? (
                <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{copy.reply}</p>
                  <p className="mt-1 text-sm">{review.ownerReply}</p>
                </div>
              ) : null}

              <div className="mt-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setActiveReplyId((current) => current === review.id ? null : review.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {copy.reply}
                </button>

                {activeReplyId === review.id ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      rows={3}
                      value={replyDrafts[review.id] ?? ""}
                      onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))}
                      placeholder={copy.replyPlaceholder}
                      className={dashboardInputClass}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={savingReplyId === review.id}
                        onClick={() => saveReply(review.id)}
                        className={dashboardPrimaryActionClass}
                      >
                        {copy.saveReply}
                      </button>
                      {canUseAiReplies ? (
                        <button
                          type="button"
                          disabled={generatingReplyId === review.id}
                          onClick={() => generateReply(review.id)}
                          className={dashboardOutlineActionClass}
                        >
                          {copy.generateReply}
                        </button>
                      ) : (
                        <Link href="/dashboard/billing" className="text-xs text-primary hover:underline">
                          {copy.upgradeReply}
                        </Link>
                      )}
                      {savedReplyId === review.id ? (
                        <span className="text-sm text-muted-foreground">{copy.replySaved}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className={cn(dashboardOutlineActionClass, "min-h-11")}
            disabled={loadingMore}
            onClick={loadMoreReviews}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
