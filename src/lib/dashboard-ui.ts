import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Shared dashboard form + surface tokens (Apple HIG aligned). */
export const dashboardInputClass = cn(
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm",
  "placeholder:text-muted-foreground/60",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
);

export const dashboardLabelClass = "text-sm font-medium text-foreground";

export const dashboardPageClass = "space-y-6";

/** Primary content document — inset white surface on recessed canvas. */
export const dashboardSurfaceClass = cn(
  "rounded-3xl border border-black/[0.06] bg-card shadow-[0_1px_0_rgba(0,0,0,0.03)]",
  "dark:border-white/[0.08] dark:shadow-none",
);

export const dashboardSectionClass = cn(dashboardSurfaceClass, "p-5");

export const dashboardSectionMutedClass = cn(
  "rounded-3xl border border-border/50 bg-muted/25 p-5",
  "dark:bg-muted/15",
);

export const dashboardCardClass = cn(
  "rounded-2xl border border-black/[0.06] bg-card",
  "dark:border-white/[0.08]",
);

export const dashboardFilterPillClass = (active: boolean) =>
  cn(
    "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
    active
      ? "border-primary bg-primary/5 text-primary"
      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
  );

export const dashboardFocusRing =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
export const dashboardShellCanvasClass = "bg-dashboard-canvas text-foreground";

export const dashboardMainCanvasClass = "bg-dashboard-main text-foreground";

export const dashboardChromeClass = cn(
  "border-border/70 bg-dashboard-chrome/90 backdrop-blur-md",
  "dark:border-border/50",
);

/** Client pipeline stage — one hue per stage so the four are distinguishable at a glance. */
export type ClientStage = "lead" | "prospect" | "active" | "churned";

export const CLIENT_STAGE_BADGE_CLASS: Record<ClientStage, string> = {
  lead: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-400/20",
  prospect: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-700/20 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-400/20",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20",
  churned: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

export const CLIENT_STAGE_DOT_CLASS: Record<ClientStage, string> = {
  lead: "bg-blue-500",
  prospect: "bg-violet-500",
  active: "bg-emerald-500",
  churned: "bg-muted-foreground/50",
};
