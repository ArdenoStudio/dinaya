import { formatLkr, cn } from "@/lib/utils";

type Props = {
  priceLkr: number;
  /** When set (e.g. deal discount), shown as the main price with original struck through. */
  displayPrice?: number;
  variant?: "prominent" | "inline";
  label?: string;
  className?: string;
};

export function BookingServicePrice({
  priceLkr,
  displayPrice,
  variant = "inline",
  label = "Service price",
  className,
}: Props) {
  const price = displayPrice ?? priceLkr;
  const isFree = priceLkr <= 0;
  const hasDiscount = !isFree && displayPrice != null && displayPrice < priceLkr;

  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--booking-accent)]/25 bg-[var(--booking-accent-muted)] px-3.5 py-3",
          className,
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="text-right">
          {hasDiscount ? (
            <span className="block text-xs tabular-nums text-muted-foreground line-through">
              {formatLkr(priceLkr)}
            </span>
          ) : null}
          <span
            className={cn(
              "text-xl font-semibold tabular-nums tracking-tight",
              isFree ? "text-foreground" : "booking-text-accent",
            )}
          >
            {isFree ? "Free" : formatLkr(price)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        isFree ? "text-foreground" : "booking-text-accent",
        className,
      )}
    >
      {isFree ? "Free" : formatLkr(price)}
    </span>
  );
}
