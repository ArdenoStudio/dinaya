import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  completed: "border-primary/25 bg-primary/10 text-primary",
  failed: "border-red-200 bg-red-50 text-red-700",
  no_show: "border-amber-300 bg-amber-50 text-amber-800",
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  refunded: "border-violet-200 bg-violet-50 text-violet-700",
  success: "border-primary/25 bg-primary/10 text-primary",
  confirmed: "border-violet-200 bg-violet-50 text-violet-700",
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
        statusStyles[status] ?? "border-slate-300 bg-white text-slate-700",
        className
      )}
    >
      {label}
    </span>
  );
}
