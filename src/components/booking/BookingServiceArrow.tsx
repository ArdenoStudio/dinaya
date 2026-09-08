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
          ? "border-(--booking-accent)/40 booking-bg-accent-muted booking-text-accent shadow-xs"
          : "border-border/60 bg-muted/25 text-muted-foreground/70 group-hover:border-(--booking-accent)/35 group-hover:booking-bg-accent-muted group-hover:booking-text-accent group-hover:shadow-xs group-focus-visible:border-(--booking-accent)/35 group-focus-visible:booking-bg-accent-muted group-focus-visible:booking-text-accent",
        className,
      )}
    >
      <Icon name="chevron-right" className="size-3.5" />
    </span>
  );
}
