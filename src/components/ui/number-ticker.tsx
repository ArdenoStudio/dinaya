"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function format(value: number, decimals: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface NumberTickerProps {
  /** The final value to count up to. */
  value: number;
  /** Fixed decimal places (e.g. 1 for a 4.7 rating). */
  decimals?: number;
  /** Animation length in seconds. */
  duration?: number;
  /** Wait until scrolled into view before counting (default true). */
  startOnView?: boolean;
  className?: string;
}

/**
 * Counts up from 0 to `value` once, when scrolled into view.
 *
 * Robust by design:
 * - Server + first client render show the real value, so no-JS, SEO crawlers
 *   and screen readers always get correct content (also via `aria-label`).
 * - The starting value is reset before paint, so there is no flash of the
 *   final number before the count-up begins.
 * - Honours `prefers-reduced-motion` — renders the static value, no animation.
 */
export function NumberTicker({
  value,
  decimals = 0,
  duration = 1.4,
  startOnView = true,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(() => format(value, decimals));

  // Before the browser paints on the client, reset to the start value so the
  // count-up has somewhere to travel from (skipped for reduced motion).
  useIsomorphicLayoutEffect(() => {
    if (prefersReduced) return;
    setDisplay(format(0, decimals));
  }, [prefersReduced, decimals]);

  useEffect(() => {
    if (prefersReduced) return;
    if (startOnView && !inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest, decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, startOnView, prefersReduced]);

  return (
    <span ref={ref} className={className} aria-label={format(value, decimals)}>
      {display}
    </span>
  );
}
