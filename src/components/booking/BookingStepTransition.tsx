"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import {
  bookingStepInitial,
  bookingStepVariants,
  bookingTransition,
} from "@/lib/booking/booking-motion";

export type WizardStep = "service" | "staff" | "dateTime" | "confirm";

interface Props {
  step: WizardStep;
  children: React.ReactNode;
  className?: string;
}

export function BookingStepTransition({ step, children, className }: Props) {
  const reduceMotion = useReducedMotion() ?? false;

  if (reduceMotion) {
    return (
      <div key={step} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={step}
        className={className}
        initial={bookingStepInitial(reduceMotion)}
        animate="enter"
        exit="exit"
        variants={bookingStepVariants(reduceMotion)}
        transition={bookingTransition(reduceMotion)}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

interface InnerProps {
  stepKey: string;
  children: React.ReactNode;
  className?: string;
}

/** Cross-fade within the main booking column (e.g. date/time → details). */
export function BookingMainStepTransition({ stepKey, children, className }: InnerProps) {
  const reduceMotion = useReducedMotion() ?? false;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={stepKey}
        className={className}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={bookingTransition(reduceMotion)}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
