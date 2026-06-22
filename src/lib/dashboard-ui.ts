import { cn } from "@/lib/utils";

/** Shared dashboard form + surface tokens (Apple HIG aligned). */
export const dashboardInputClass = cn(
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base sm:text-sm",
  "placeholder:text-muted-foreground/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  "dark:border-neutral-700 dark:bg-neutral-900",
);

export const dashboardLabelClass = "text-sm font-medium text-foreground";

export const dashboardSectionClass =
  "rounded-xl border border-border bg-card p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";

export const dashboardFilterPillClass = (active: boolean) =>
  cn(
    "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    active
      ? "border-primary bg-primary/5 text-primary"
      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground dark:border-neutral-700",
  );

export const dashboardFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const PLAN_BANNER_PATHS = [
  "/dashboard",
  "/dashboard/billing",
  "/dashboard/settings",
] as const;

export function shouldShowPlanBanner(activeHref: string, plan: string): boolean {
  if (plan !== "trial" && plan !== "expired") return false;
  return PLAN_BANNER_PATHS.some(
    (path) => activeHref === path || activeHref.startsWith(`${path}/`),
  );
}
