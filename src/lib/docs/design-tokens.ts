/** Shared visual tokens for documentation surfaces (not used in product dashboard). */

export const docsFrameShadow =
  "shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.06)]";

export const docsFloorShadow =
  "shadow-[0_24px_48px_-12px_rgb(0,0,0,0.12),0_8px_16px_-8px_rgb(0,0,0,0.08)]";

export const docsCardSurface =
  "rounded-2xl border border-gray-200 dark:border-neutral-800/80 bg-white shadow-sm shadow-gray-900/5 dark:shadow-black/20";

export const docsHeroSurface =
  "rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 shadow-sm shadow-gray-900/5 dark:shadow-black/20";

export const docsSpring = { type: "spring" as const, stiffness: 300, damping: 30 };
