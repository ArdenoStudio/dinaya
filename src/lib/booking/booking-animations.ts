import type { Variants } from "motion/react";

// Panel slides in from right (used when a new column appears)
export const fadeInLeft = {
  variants: {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: 20 },
  } satisfies Variants,
  initial: "hidden",
  exit: "hidden",
  animate: "visible",
  transition: { ease: "easeInOut" as const, delay: 0.1 },
};

// Content within a panel fades up (used inside ServiceMetaPanel)
export const fadeInUp = {
  variants: {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 20 },
  } satisfies Variants,
  initial: "hidden",
  exit: "hidden",
  animate: "visible",
  transition: { ease: "easeInOut" as const, delay: 0.1 },
};

// Content slides in from right (used for form panel replacing slots)
export const fadeInRight = {
  variants: {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -20 },
  } satisfies Variants,
  initial: "hidden",
  exit: "hidden",
  animate: "visible",
  transition: { ease: "easeInOut" as const, delay: 0.1 },
};

export const RESIZE_DURATION = 0.5;
export const RESIZE_EASE = [0.4, 0, 0.2, 1] as const;
