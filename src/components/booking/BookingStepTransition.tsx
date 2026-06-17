"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";

interface Props {
  uiState: string;
  children: React.ReactNode;
}

export default function BookingStepTransition({ uiState, children }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={uiState}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={uiState}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
