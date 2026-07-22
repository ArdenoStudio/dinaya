import { cn } from "@/lib/utils";
import { statusStyles } from "@/lib/dashboard-status";

export {
  statusStyles,
  statusBorderStyles,
  statusSurfaceStyles,
} from "@/lib/dashboard-status";

export function StatusBadge({
  className,
  status,
}: {
  className?: string;
  status: string;
}) {
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ??
          "border-border bg-card text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
