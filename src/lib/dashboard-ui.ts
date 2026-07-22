import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Shared dashboard form + surface tokens (Apple HIG aligned). */
export const dashboardInputClass = cn(
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm",
  "placeholder:text-muted-foreground/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

export const dashboardLabelClass = "text-sm font-medium text-foreground";

export const dashboardPageClass = "space-y-6";

export const dashboardSectionClass = cn(
  "rounded-2xl border border-border/80 bg-card p-5 shadow-sm",
  "dark:border-border/60",
);

export const dashboardSectionMutedClass = cn(
  "rounded-2xl border border-border/70 bg-muted/30 p-5",
  "dark:bg-muted/20",
);

export const dashboardCardClass = cn(
  "rounded-2xl border border-border/80 bg-card shadow-sm",
  "dark:border-border/60",
);

export const dashboardFilterPillClass = (active: boolean) =>
  cn(
    "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    active
      ? "border-primary bg-primary/5 text-primary"
      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
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

export const dashboardPrimaryActionClass = cn(
  buttonVariants({ size: "touch" }),
  "inline-flex items-center gap-1.5",
);

export const dashboardOutlineActionClass = cn(
  buttonVariants({ variant: "outline", size: "touch" }),
  "inline-flex items-center gap-1.5",
);

/** Inline form errors — readable on light and dark surfaces (WCAG AA body text). */
export const dashboardErrorAlertClass =
  "text-sm text-red-700 dark:text-red-400";

/** Soft page canvas behind dashboard chrome (replaces stacked neutral grays). */
export const dashboardShellCanvasClass =
  "bg-[hsl(var(--dashboard-canvas))] text-foreground";

export const dashboardMainCanvasClass =
  "bg-[hsl(var(--dashboard-main))] text-foreground";

export const dashboardChromeClass = cn(
  "border-border/70 bg-[hsl(var(--dashboard-chrome))]/90 backdrop-blur-md",
  "dark:border-border/50",
);
