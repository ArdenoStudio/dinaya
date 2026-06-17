"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { BookingStep } from "./booking-steps";

interface Props {
  step: BookingStep;
  children: React.ReactNode;
}

export default function BookingStepTransition({ step, children }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={step}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
