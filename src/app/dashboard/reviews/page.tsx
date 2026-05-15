"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type Review = {
  id: string;
  clientName: string;
  rating: number;
  comment: string | null;
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

  useEffect(() => {
    fetch("/api/dashboard/reviews")
      .then((r) => r.json())
      .then((data) => { setReviewList(data); setLoading(false); });
  }, []);

  async function togglePublished(id: string, current: boolean) {
    const res = await fetch(`/api/dashboard/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviewList((prev) => prev.map((r) => r.id === id ? updated : r));
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
            Client reviews shown on your booking page.
          </p>
        </div>
      </div>

      {/* Stats */}
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
          <p className="text-xs text-muted-foreground mt-1">
            Reviews appear here after clients submit them on your booking confirmation page.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Client</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Rating</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Comment</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Date</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs">Visible</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviewList.map((review) => (
                <tr key={review.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{review.clientName}</td>
                  <td className="px-5 py-3.5"><Stars rating={review.rating} /></td>
                  <td className="px-5 py-3.5 text-muted-foreground max-w-xs">
                    <span className="line-clamp-2">{review.comment ?? <em className="text-xs">No comment</em>}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(review.createdAt), "d MMM yyyy")}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => togglePublished(review.id, review.isPublished)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${review.isPublished ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${review.isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-sm"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
