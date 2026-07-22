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
          "border-slate-300 bg-white text-slate-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
        className,
      )}
    >
      {label}
    </span>
  );
}
