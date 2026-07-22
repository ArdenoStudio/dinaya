import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
  className,
}: {
  action?: React.ReactNode;
  description?: string;
  icon?: LucideIcon;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/80 bg-card px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      <h2 className="font-cal text-base tracking-tight">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
