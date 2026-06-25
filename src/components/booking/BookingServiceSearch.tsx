"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  categories?: string[];
  activeCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
  allCategoriesLabel?: string;
  resultCount?: number;
  totalCount?: number;
  showingLabel?: string;
  className?: string;
};

export function BookingServiceSearch({
  query,
  onQueryChange,
  placeholder,
  categories = [],
  activeCategory = null,
  onCategoryChange,
  allCategoriesLabel = "All",
  resultCount,
  totalCount,
  showingLabel,
  className,
}: Props) {
  const showCategoryChips = categories.length > 1 && onCategoryChange;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-h-11 w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-[var(--booking-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)] md:text-sm"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)]"
            aria-label="Clear search"
          >
            <Icon name="x-lg" className="size-4" />
          </button>
        ) : null}
      </div>

      {showCategoryChips ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-none">
          <CategoryChip
            label={allCategoriesLabel}
            active={!activeCategory}
            onClick={() => onCategoryChange(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </div>
      ) : null}

      {showingLabel && resultCount != null && totalCount != null && resultCount !== totalCount ? (
        <p className="text-xs text-muted-foreground">{showingLabel}</p>
      ) : null}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)]",
        active
          ? "border-[var(--booking-accent)] bg-[var(--booking-accent-muted)] text-[var(--booking-accent)]"
          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
