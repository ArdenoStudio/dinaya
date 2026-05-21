"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Review = {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  isPublished: boolean;
  createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`bi ${n <= rating ? "bi-star-fill text-amber-400" : "bi-star text-gray-300"} text-xs`} />
      ))}
    </span>
  );
}

export default function ReviewsDashboardPage() {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/dashboard/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviewList(data);
        setReplyDrafts(
          Object.fromEntries(
            (data as Review[]).map((review) => [review.id, review.ownerReply ?? ""]),
          ),
        );
        setLoading(false);
      });
  }, []);

  async function togglePublished(id: string, current: boolean) {
    const res = await fetch(`/api/dashboard/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviewList((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function saveReply(id: string) {
    const res = await fetch(`/api/dashboard/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerReply: replyDrafts[id] || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviewList((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    const res = await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviewList((prev) => prev.filter((r) => r.id !== id));
  }

  const published = reviewList.filter((r) => r.isPublished).length;
  const avgRating = reviewList.length
    ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-cal text-2xl">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Client reviews shown on your booking page. Pro plan unlocks public replies.
          </p>
        </div>
      </div>

      {reviewList.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="font-cal text-2xl">{reviewList.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total reviews</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="font-cal text-2xl">{avgRating}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Average rating</p>
          </div>
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="font-cal text-2xl">{published}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Published</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : reviewList.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <i className="bi bi-star text-3xl text-muted-foreground/40 block mb-3" />
          <p className="font-medium text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{review.clientName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "d MMM yyyy")}
                    </span>
                  </div>
                  {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublished(review.id, review.isPublished)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${review.isPublished ? "bg-primary" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${review.isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <button onClick={() => deleteReview(review.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Your reply</label>
                <textarea
                  value={replyDrafts[review.id] ?? ""}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Thank the client publicly…"
                />
                <button
                  type="button"
                  onClick={() => saveReply(review.id)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
                >
                  Save reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
