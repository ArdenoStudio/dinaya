interface Props {
  rating: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, size = "sm" }: Props) {
  const iconClass = size === "md" ? "text-base" : "text-xs";

  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <i
          key={value}
          className={`bi ${value <= rating ? "bi-star-fill text-amber-400" : "bi-star text-gray-300"} ${iconClass}`}
        />
      ))}
    </span>
  );
}
