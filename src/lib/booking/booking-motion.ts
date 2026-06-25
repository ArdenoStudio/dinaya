import type { Transition, Variants } from "motion/react";

/** Apple-like ease — fast, no bounce. */
export const BOOKING_MOTION_EASE = [0.25, 0.1, 0.25, 1] as const;

export const BOOKING_MOTION_DURATION = 0.22;

export const bookingTransition = (reduceMotion: boolean): Transition =>
  reduceMotion
    ? { duration: 0 }
    : { duration: BOOKING_MOTION_DURATION, ease: BOOKING_MOTION_EASE };

export const bookingStepVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? {
        enter: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        enter: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

export const bookingStepInitial = (reduceMotion: boolean) =>
  reduceMotion ? false : { opacity: 0, y: 10 };

export const bookingPanelVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? { visible: { opacity: 1 }, hidden: { opacity: 1 } }
    : {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 12 },
      };

export function bookingPanelMotion(reduceMotion: boolean, animate = true) {
  if (!animate || reduceMotion) return {};
  return {
    variants: bookingPanelVariants(reduceMotion),
    initial: "hidden" as const,
    animate: "visible" as const,
    transition: bookingTransition(reduceMotion),
  };
}
