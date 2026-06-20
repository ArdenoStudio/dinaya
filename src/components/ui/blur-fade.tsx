"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  /** Vertical travel in pixels. */
  yOffset?: number;
  /** Initial blur amount. */
  blur?: string;
  duration?: number;
  inViewMargin?: string;
}

/**
 * Reveals its children with a subtle blur + fade + rise as they scroll into
 * view (once). Honours `prefers-reduced-motion` by rendering children plainly.
 *
 * Use for secondary, below-the-fold sections — not for primary above-the-fold
 * content, since it starts hidden.
 */
export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 10,
  blur = "6px",
  duration = 0.5,
  inViewMargin = "0px 0px -8% 0px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: inViewMargin });

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
