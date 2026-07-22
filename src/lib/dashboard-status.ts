/** Canonical booking / payment status colors for the whole dashboard. */
export const statusStyles: Record<string, string> = {
  cancelled:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  confirmed:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  failed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  no_show:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
  pending:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
  refunded:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
};

/** Calendar / timeline left-edge accents. */
export const statusBorderStyles: Record<string, string> = {
  cancelled: "border-l-slate-300",
  completed: "border-l-emerald-500",
  confirmed: "border-l-emerald-500",
  failed: "border-l-red-400",
  no_show: "border-l-amber-400",
  pending: "border-l-amber-400",
  refunded: "border-l-violet-500",
  success: "border-l-emerald-500",
};

/** Dense calendar chip backgrounds. */
export const statusSurfaceStyles: Record<string, string> = {
  cancelled:
    "bg-slate-100 border-slate-300 text-slate-800 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-200",
  completed:
    "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100",
  confirmed:
    "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100",
  failed:
    "bg-red-100 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-100",
  no_show:
    "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100",
  pending:
    "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100",
};
