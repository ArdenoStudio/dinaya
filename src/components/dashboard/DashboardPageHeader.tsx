import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardPageHeaderProps = {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  tabs?: ReactNode;
  className?: string;
  size?: "default" | "lg";
};

export function DashboardPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  eyebrow,
  tabs,
  className,
  size = "default",
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          actions
            ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            : undefined,
        )}
      >
        <div className="min-w-0">
          {backHref ? (
            <Link href={backHref} className="text-sm text-primary hover:underline">
              ← {backLabel}
            </Link>
          ) : null}
          {eyebrow ? (
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-widest text-muted-foreground/70",
                backHref && "mt-2",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-cal tracking-tight",
              size === "lg" ? "text-3xl" : "text-2xl",
              (backHref || eyebrow) && "mt-2",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {tabs ? <div className="flex flex-wrap items-center gap-2">{tabs}</div> : null}
    </div>
  );
}
