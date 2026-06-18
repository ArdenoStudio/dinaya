import { Icon } from "@/components/ui/Icon";
import { Card, CardContent } from "@/components/ui/card";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name={n <= Math.round(rating) ? "star-fill" : "star"}
          className={`text-xs ${n <= Math.round(rating) ? "text-amber-400" : "text-muted-foreground/40"}`}
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
    <Card className="mx-0 rounded-none border-x-0 border-t-0 shadow-none md:hidden">
      <CardContent className="px-4 py-3.5">
        {hasRating && (
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={avgRating} />
            <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </span>
          </div>
        )}
        {description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        {cancellationPolicy && (
          <p className="mt-2 text-xs text-muted-foreground">{cancellationPolicy}</p>
        )}
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Icon name="shield-check" className="text-[10px]" />
          {securedLabel}
        </p>
      </CardContent>
    </Card>
  );
}
