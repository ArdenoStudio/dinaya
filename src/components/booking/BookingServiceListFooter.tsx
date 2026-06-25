"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";

type Props = {
  copy: BookingCopy;
  showMore: boolean;
  remaining: number;
  onShowMore: () => void;
  usePagination: boolean;
  searchPage: number;
  totalPages: number;
  onSearchPageChange: (page: number) => void;
  className?: string;
};

export function BookingServiceListFooter({
  copy,
  showMore,
  remaining,
  onShowMore,
  usePagination,
  searchPage,
  totalPages,
  onSearchPageChange,
  className,
}: Props) {
  if (!showMore && !usePagination) return null;

  if (usePagination && totalPages > 1) {
    const pageLabel = copy.servicesPage
      .replace("{page}", String(searchPage))
      .replace("{total}", String(totalPages));

    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-border/60 pt-4",
          className,
        )}
      >
        <button
          type="button"
          disabled={searchPage <= 1}
          onClick={() => onSearchPageChange(searchPage - 1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={copy.previousPage}
        >
          <Icon name="chevron-left" className="text-xs" />
          {copy.previousPage}
        </button>
        <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
          {pageLabel}
        </p>
        <button
          type="button"
          disabled={searchPage >= totalPages}
          onClick={() => onSearchPageChange(searchPage + 1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={copy.nextPage}
        >
          {copy.nextPage}
          <Icon name="chevron-right" className="text-xs" />
        </button>
      </div>
    );
  }

  if (!showMore) return null;

  const label =
    remaining > 0
      ? copy.showMoreServicesCount.replace("{count}", String(Math.min(remaining, 12)))
      : copy.showMoreServices;

  return (
    <div className={cn("pt-3", className)}>
      <button
        type="button"
        onClick={onShowMore}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
      >
        {label}
        <Icon name="chevron-down" className="text-xs text-muted-foreground" />
      </button>
    </div>
  );
}
