/** Shared visual tokens for documentation surfaces (not used in product dashboard). */

/** Soft product-shot depth — Apple marketing style, not heavy card chrome. */
export const docsShotShadow =
  "shadow-[0_1px_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.06),0_24px_48px_-16px_rgba(0,0,0,0.12)]";

export const docsFrameShadow =
  "shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.06)]";

export const docsFloorShadow =
  "shadow-[0_28px_56px_-18px_rgb(0,0,0,0.18),0_10px_20px_-10px_rgb(0,0,0,0.08)]";

export const docsCardSurface =
  "rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-neutral-900";

export const docsHeroSurface =
  "rounded-[1.75rem] border border-black/[0.06] bg-[hsl(240_8%_97%)] dark:border-white/[0.08] dark:bg-[hsl(240_6%_8%)]";

export const docsSpring = { type: "spring" as const, stiffness: 320, damping: 34, bounce: 0 };

export const docsTrafficLights = {
  close: "#ff5f57",
  minimize: "#febc2e",
  zoom: "#28c840",
} as const;
