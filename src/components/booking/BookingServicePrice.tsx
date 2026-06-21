import { formatLkr, cn } from "@/lib/utils";

type Props = {
  priceLkr: number;
  /** When set (e.g. deal discount), shown as the main price with original struck through. */
  displayPrice?: number;
  className?: string;
};

/** Service price — readable, not louder than the service name. */
export function BookingServicePrice({
  priceLkr,
  displayPrice,
  className,
}: Props) {
  const price = displayPrice ?? priceLkr;
  const isFree = priceLkr <= 0;
  const hasDiscount = !isFree && displayPrice != null && displayPrice < priceLkr;

  if (isFree) {
    return <span className={cn("font-medium text-foreground", className)}>Free</span>;
  }

  if (hasDiscount) {
    return (
      <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
        <span className="text-muted-foreground line-through">{formatLkr(priceLkr)}</span>
        <span className="font-medium text-foreground">{formatLkr(price)}</span>
      </span>
    );
  }

  return (
    <span className={cn("font-medium tabular-nums text-foreground", className)}>
      {formatLkr(price)}
    </span>
  );
}
