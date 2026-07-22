/** Shared visual tokens for documentation surfaces (not used in product dashboard). */

/** Soft product-shot depth — Apple marketing style, not heavy card chrome. */
export const docsShotShadow =
  "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.04),0_18px_44px_-10px_rgba(0,0,0,0.18),0_48px_90px_-36px_rgba(0,0,0,0.22)]";

export const docsFrameShadow =
  "shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_8px_28px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.04)]";

/** Single soft contact under phone — do not stack with device-intrinsic shadows. */
export const docsFloorShadow =
  "shadow-[0_28px_60px_-28px_rgba(0,0,0,0.35),0_10px_20px_-12px_rgba(0,0,0,0.12)]";

export const docsCardSurface =
  "rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-12px_rgba(0,0,0,0.1)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";

export const docsHeroSurface =
  "rounded-[1.85rem] bg-[hsl(240_8%_97%)] shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-[hsl(240_6%_8%)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07)]";

/** Studio stage behind product shots */
export const docsStageSurface =
  "rounded-[1.5rem] bg-[radial-gradient(ellipse_at_50%_0%,hsl(220_10%_96%),hsl(240_8%_94%)_55%,hsl(240_6%_92%))] dark:bg-[radial-gradient(ellipse_at_50%_0%,hsl(240_6%_14%),hsl(240_6%_8%)_60%)]";

/** Interruptible spring — bounce must stay 0. */
export const docsSpring = { type: "spring" as const, stiffness: 380, damping: 36, bounce: 0 };

export const docsEase = [0.2, 0, 0, 1] as const;
