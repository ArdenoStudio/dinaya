import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  cancelled:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  completed: "border-primary/25 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  failed:
    "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  no_show:
    "border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
  pending:
    "border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
  refunded:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200",
  success: "border-primary/25 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  confirmed:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200",
};

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
        className
      )}
    >
      {label}
    </span>
  );
}
