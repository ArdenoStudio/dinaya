"use client";

interface Props {
  label: string;
}

export function BookingCategoryPill({ label }: Props) {
  return (
    <span className="inline-flex max-w-[11rem] shrink-0 items-center truncate rounded-full border border-border/60 bg-muted/35 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-muted/20 sm:max-w-[14rem] sm:text-xs">
      {label}
    </span>
  );
}
