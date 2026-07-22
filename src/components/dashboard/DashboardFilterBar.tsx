import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardFilterBarProps = {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function DashboardFilterBar({ children, trailing, className }: DashboardFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
