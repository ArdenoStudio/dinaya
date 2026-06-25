import { Icon } from "@/components/ui/Icon";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessRating } from "@/components/booking/BusinessRating";
import type { BookingCopy } from "@/lib/i18n";

type Props = {
  description?: string | null;
  avgRating: number | null;
  reviewCount: number;
  cancellationPolicy?: string | null;
  securedLabel: string;
  copy: BookingCopy;
};

export default function BookingMobileTrustStrip({
  description,
  avgRating,
  reviewCount,
  cancellationPolicy,
  securedLabel,
  copy,
}: Props) {
  const hasRating = avgRating !== null && reviewCount > 0;
  const hasContent = hasRating || description || cancellationPolicy;
  if (!hasContent) return null;

  return (
    <Card className="mx-0 rounded-none border-x-0 border-t-0 shadow-none md:hidden">
      <CardContent className="px-4 py-3.5">
        {hasRating && (
          <div className="mb-2">
            <BusinessRating
              avgRating={avgRating}
              reviewCount={reviewCount}
              copy={copy}
              size="sm"
            />
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
