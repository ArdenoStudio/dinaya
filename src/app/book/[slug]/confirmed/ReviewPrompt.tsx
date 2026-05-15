"use client";

import { useState } from "react";

interface Props {
  slug: string;
  bookingId: string;
  clientName: string;
  businessName: string;
}

export default function ReviewPrompt({ slug, bookingId, clientName, businessName }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  if (done) {
    return (
      <div className="bg-white border rounded-2xl p-6 text-center shadow-sm">
        <i className="bi bi-stars text-2xl text-amber-400 mb-2 block" />
        <p className="font-medium text-sm">Thanks for your review!</p>
        <p className="text-xs text-muted-foreground mt-1">It helps others discover {businessName}.</p>
      </div>
    );
  }

  async function submit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/reviews/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, clientName, rating, comment }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error ?? "Something went wrong.");
    }
    setSubmitting(false);
  }

  const displayRating = hovered || rating;

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-sm">How was your experience?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Leave a quick review for {businessName}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none mt-0.5"
        >
          <i className="bi bi-x" />
        </button>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <i className={`bi ${n <= displayRating ? "bi-star-fill text-amber-400" : "bi-star text-gray-300"}`} />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share a few words about your experience (optional)…"
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-3"
        />
      )}

      {error && <p className="text-destructive text-xs mb-3">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={rating === 0 || submitting}
          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-4 py-2.5 rounded-xl border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
