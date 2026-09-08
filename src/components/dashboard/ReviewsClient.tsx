"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "@heroui/react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useDashboardCopy } from "@/components/dashboard/DashboardLocaleProvider";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardSwitch, DashboardTextAreaField } from "@/components/dashboard/DashboardFormField";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Star, Trash2 } from "lucide-react";
import {
  dashboardCardClass,
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
        <Star
          key={n}
          className={`size-3.5 ${n <= rating ? "text-amber-400" : "text-gray-300"}`}
          fill={n <= rating ? "currentColor" : "none"}
        />
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReviewsSummary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [generatingReplyId, setGeneratingReplyId] = useState<string | null>(null);

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
      toast.danger("Could not load more reviews");
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
    } else {
      toast.danger("Could not update review visibility");
    }
  }

  async function deleteReview(id: string) {
    const response = await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE" });
    if (response.ok) {
      setReviewList((prev) => prev.filter((review) => review.id !== id));
      toast.success("Review deleted");
    } else {
      toast.danger("Could not delete review");
    }
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
      toast.success(copy.replySaved);
    } else {
      toast.danger("Could not save reply");
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
    } else {
      toast.danger("Could not generate a reply");
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
        <DashboardLoadingPanel rows={3} />
      ) : loadError ? (
        <div className={cn(dashboardSectionMutedClass, "text-center")}>
          <p className="text-sm text-destructive">{loadError}</p>
        </div>
      ) : reviewList.length === 0 ? (
        <EmptyState icon={Star} title={copy.emptyTitle} description={copy.emptyBody} />
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
                  <DashboardSwitch
                    label={copy.visible}
                    isSelected={review.isPublished}
                    onChange={() => togglePublished(review.id, review.isPublished)}
                  />
                  <>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Delete review"
                      onClick={() => setConfirmDeleteId(review.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <ConfirmDialog
                      title="Delete review"
                      description="Delete this review? This cannot be undone."
                      confirmLabel="Delete"
                      variant="destructive"
                      onConfirm={() => deleteReview(review.id)}
                      open={confirmDeleteId === review.id}
                      onOpenChange={(open) => setConfirmDeleteId(open ? review.id : null)}
                    />
                  </>
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
                    <DashboardTextAreaField
                      label={copy.reply}
                      value={replyDrafts[review.id] ?? ""}
                      onChange={(value) => setReplyDrafts((prev) => ({ ...prev, [review.id]: value }))}
                      placeholder={copy.replyPlaceholder}
                      rows={3}
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
