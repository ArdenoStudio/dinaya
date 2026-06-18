import { Icon } from "@/components/ui/Icon";

interface Props {
  rating: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, size = "sm" }: Props) {
  const iconClass = size === "md" ? "text-base" : "text-xs";

  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Icon
          key={value}
          name={value <= Math.round(rating) ? "star-fill" : "star"}
          className={`${value <= Math.round(rating) ? "text-amber-400" : "text-gray-300 dark:text-neutral-600"} ${iconClass}`}
        />
      ))}
    </span>
  );
}
