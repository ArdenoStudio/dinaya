import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Props = {
  selected?: boolean;
  className?: string;
};

/** Trailing affordance for service rows — color/shadow only, no slide (avoids edge clip). */
export function BookingServiceArrow({ selected = false, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center self-center rounded-full border transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
        "motion-reduce:transition-none",
        selected
          ? "border-[var(--booking-accent)]/40 bg-[var(--booking-accent-muted)] text-[var(--booking-accent)] shadow-sm"
          : "border-border/60 bg-muted/25 text-muted-foreground/70 group-hover:border-[var(--booking-accent)]/35 group-hover:bg-[var(--booking-accent-muted)] group-hover:text-[var(--booking-accent)] group-hover:shadow-sm group-focus-visible:border-[var(--booking-accent)]/35 group-focus-visible:bg-[var(--booking-accent-muted)] group-focus-visible:text-[var(--booking-accent)]",
        className,
      )}
    >
      <Icon name="chevron-right" className="size-3.5" />
    </span>
  );
}
