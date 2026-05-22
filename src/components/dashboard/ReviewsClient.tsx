"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useDashboardCopy } from "@/components/dashboard/DashboardLocaleProvider";
import { Icon } from "@/components/ui/Icon";

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
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [generatingReplyId, setGeneratingReplyId] = useState<string | null>(null);
  const [savedReplyId, setSavedReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/reviews")
      .then((response) => response.json())
      .then((data: Review[]) => {
        setReviewList(data);
        setReplyDrafts(Object.fromEntries(data.map((review) => [review.id, review.ownerReply ?? ""])));
        setLoading(false);
      });
  }, []);

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
    if (!confirm("Delete this review? This cannot be undone.")) return;
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

  const published = reviewList.filter((review) => review.isPublished).length;
  const avgRating = reviewList.length
    ? (reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-cal text-2xl">{copy.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>

      {reviewList.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="font-cal text-2xl">{reviewList.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.totalReviews}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="font-cal text-2xl">{avgRating}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.averageRating}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <p className="font-cal text-2xl">{published}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.published}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      ) : reviewList.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Icon name="star" className="mb-3 block text-3xl text-muted-foreground/40" />
          <p className="text-sm font-medium">{copy.emptyTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.emptyBody}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-5">
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
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${review.isPublished ? "bg-primary" : "bg-gray-200"}`}
                    aria-label={copy.visible}
                  >
                    <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${review.isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review.id)}
                    className="text-sm text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>

              {review.ownerReply ? (
                <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">{copy.reply}</p>
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
                      className="w-full rounded-lg border px-3 py-2.5 text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={savingReplyId === review.id}
                        onClick={() => saveReply(review.id)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                      >
                        {copy.saveReply}
                      </button>
                      {canUseAiReplies ? (
                        <button
                          type="button"
                          disabled={generatingReplyId === review.id}
                          onClick={() => generateReply(review.id)}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary/40 disabled:opacity-60"
                        >
                          {copy.generateReply}
                        </button>
                      ) : (
                        <Link href="/dashboard/billing" className="text-xs text-violet-700 hover:underline">
                          {copy.upgradeReply}
                        </Link>
                      )}
                      {savedReplyId === review.id ? (
                        <span className="text-sm text-emerald-600">{copy.replySaved}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
