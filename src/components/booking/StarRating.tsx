import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({ rating, size = "sm", className }: Props) {
  const iconClass = size === "md" ? "text-base" : "text-xs";

  return (
    <span className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Icon
          key={value}
          name={value <= Math.round(rating) ? "star-fill" : "star"}
          className={`${value <= Math.round(rating) ? "text-amber-500 dark:text-amber-400/85" : "text-muted-foreground/35"} ${iconClass}`}
        />
      ))}
    </span>
  );
}
