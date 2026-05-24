import Link from "next/link";
import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function DashboardPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className={actions ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" : undefined}>
      <div>
        {backHref ? (
          <Link href={backHref} className="text-sm text-primary hover:underline">
            ← {backLabel}
          </Link>
        ) : null}
        <h1 className={`font-cal text-2xl${backHref ? " mt-2" : ""}`}>{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
