import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dashboardSectionClass, dashboardSectionMutedClass } from "@/lib/dashboard-ui";

type DashboardSectionProps = {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  muted = false,
  id,
}: DashboardSectionProps) {
  return (
    <section
      id={id}
      className={cn(muted ? dashboardSectionMutedClass : dashboardSectionClass, className)}
    >
      {title || action || description ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="font-cal text-lg tracking-tight">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
