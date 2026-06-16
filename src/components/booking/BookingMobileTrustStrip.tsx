import { Icon } from "@/components/ui/Icon";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name={n <= Math.round(rating) ? "star-fill" : "star"}
          className={`text-xs ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
}

type Props = {
  description?: string | null;
  avgRating: number | null;
  reviewCount: number;
  cancellationPolicy?: string | null;
  securedLabel: string;
};

export default function BookingMobileTrustStrip({
  description,
  avgRating,
  reviewCount,
  cancellationPolicy,
  securedLabel,
}: Props) {
  const hasRating = avgRating !== null && reviewCount > 0;
  const hasContent = hasRating || description || cancellationPolicy;
  if (!hasContent) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-gray-100 bg-white px-4 py-3.5 md:hidden">
      {hasRating && (
        <div className="mb-2 flex items-center gap-2">
          <StarRating rating={avgRating} />
          <span className="text-sm font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">
            ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
          </span>
        </div>
      )}
      {description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{description}</p>
      )}
      {cancellationPolicy && (
        <p className="mt-2 line-clamp-2 text-xs text-gray-500">{cancellationPolicy}</p>
      )}
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Icon name="shield-check" className="text-[10px]" />
        {securedLabel}
      </p>
    </div>
  );
}
