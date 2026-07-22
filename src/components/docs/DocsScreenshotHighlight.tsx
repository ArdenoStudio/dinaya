"use client";

import { motion, useReducedMotion } from "motion/react";
import type { DocsHighlightRect } from "@/lib/docs/highlight-rects";
import { cn } from "@/lib/utils";

type Props = {
  rects: DocsHighlightRect[];
  className?: string;
};

/**
 * Soft mask spotlight over a live product screenshot.
 * Uses a single cutout ring + ambient dim — no cartoon cursor.
 */
export function DocsScreenshotHighlight({ rects, className }: Props) {
  const reduceMotion = useReducedMotion();
  if (rects.length === 0) return null;

  const primary = rects[0];

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)} aria-hidden>
      {rects.map((rect, index) => {
        const isPrimary = index === 0;
        return (
          <motion.div
            key={`${rect.x}-${rect.y}-${index}`}
            className="absolute rounded-[10px]"
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.w}%`,
              height: `${rect.h}%`,
              // Punch clear window; primary also dims the rest of the frame
              boxShadow: isPrimary
                ? "0 0 0 1.5px rgba(255,255,255,0.92), 0 12px 32px rgba(0,0,0,0.28), 0 0 0 9999px rgba(0,0,0,0.38)"
                : "0 0 0 1.5px rgba(255,255,255,0.75), 0 8px 20px rgba(0,0,0,0.18)",
            }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1], delay: index * 0.05 }}
          />
        );
      })}

      {primary.label ? (
        <motion.div
          className="absolute z-20 max-w-[40%]"
          style={{
            left: `${Math.min(primary.x + primary.w + 1.4, 72)}%`,
            top: `${Math.max(primary.y, 2)}%`,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1], delay: 0.1 }}
        >
          <span className="inline-flex items-center rounded-md bg-gray-950/90 px-2 py-1 text-[11px] font-medium tracking-tight text-white shadow-[0_4px_14px_rgba(0,0,0,0.28)]">
            {primary.label}
          </span>
        </motion.div>
      ) : null}
    </div>
  );
}
