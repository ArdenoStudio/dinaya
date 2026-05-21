import { StarRating } from "@/components/booking/StarRating";
import type { PublicReview } from "@/lib/reviews-public";

interface Props {
  businessName: string;
  avgRating: number | null;
  reviewCount: number;
  reviews: PublicReview[];
  compact?: boolean;
}

export function ReviewsWidget({
  businessName,
  avgRating,
  reviewCount,
  reviews,
  compact = false,
}: Props) {
  return (
    <div className={`bg-white ${compact ? "p-4" : "rounded-2xl border border-gray-100 p-6"}`}>
      <div className="mb-4">
        <h2 className="font-cal text-lg text-gray-900">Reviews for {businessName}</h2>
        {avgRating !== null && reviewCount > 0 ? (
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={avgRating} size="md" />
            <span className="font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">
              from {reviewCount} review{reviewCount !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">No published reviews yet.</p>
        )}
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{review.clientName}</p>
                <StarRating rating={review.rating} />
              </div>
              <p className="shrink-0 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-LK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {review.comment ? (
              <p className="text-sm leading-relaxed text-gray-500">{review.comment}</p>
            ) : null}
            {review.ownerReply ? (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-700">Response from {businessName}</p>
                <p className="mt-1 text-sm text-gray-500">{review.ownerReply}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
