import type { LucideIcon } from "lucide-react";

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: React.ReactNode;
  description?: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-white px-6 py-10 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
