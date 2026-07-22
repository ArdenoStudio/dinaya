/** Shared visual tokens for documentation surfaces (not used in product dashboard). */

/** Soft product-shot depth — Apple marketing style, not heavy card chrome. */
export const docsShotShadow =
  "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03),0_12px_28px_-8px_rgba(0,0,0,0.10),0_32px_64px_-24px_rgba(0,0,0,0.14)]";

export const docsFrameShadow =
  "shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_8px_28px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.04)]";

export const docsFloorShadow =
  "shadow-[0_24px_48px_-20px_rgba(0,0,0,0.22),0_8px_16px_-10px_rgba(0,0,0,0.10)]";

export const docsCardSurface =
  "rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-neutral-900";

export const docsHeroSurface =
  "rounded-[1.75rem] border border-black/[0.06] bg-[hsl(240_6%_97%)] dark:border-white/[0.08] dark:bg-[hsl(240_6%_8%)]";

/** Interruptible spring — bounce must stay 0. */
export const docsSpring = { type: "spring" as const, stiffness: 380, damping: 36, bounce: 0 };

export const docsTrafficLights = {
  close: "#ff5f57",
  minimize: "#febc2e",
  zoom: "#28c840",
} as const;
