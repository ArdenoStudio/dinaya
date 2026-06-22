import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardFocusRing } from "@/lib/dashboard-ui";

type DashboardListRowProps = {
  avatar?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  subtitle?: React.ReactNode;
  title: React.ReactNode;
};

export function DashboardListRow({
  avatar,
  badge,
  href,
  meta,
  onClick,
  subtitle,
  title,
}: DashboardListRowProps) {
  const inner = (
    <>
      {avatar ? <div className="shrink-0">{avatar}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">{title}</p>
          {badge}
        </div>
        {subtitle ? <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        {meta ? <div className="mt-1 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </>
  );

  const className = cn(
    "flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors",
    "hover:border-primary/20 hover:bg-muted/30 dark:border-neutral-800 dark:bg-neutral-900",
    dashboardFocusRing,
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
