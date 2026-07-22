"use client";

import { motion, useReducedMotion } from "motion/react";
import type { DocsHighlightRect } from "@/lib/docs/highlight-rects";
import { cn } from "@/lib/utils";

type Props = {
  rects: DocsHighlightRect[];
  className?: string;
};

/**
 * Soft cutout over a live product screenshot.
 * Dim surroundings only — no floating badges or cartoon cursors.
 */
export function DocsScreenshotHighlight({ rects, className }: Props) {
  const reduceMotion = useReducedMotion();
  if (rects.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", className)} aria-hidden>
      {rects.map((rect, index) => {
        const isPrimary = index === 0;
        return (
          <motion.div
            key={`${rect.x}-${rect.y}-${index}`}
            className="absolute rounded-lg"
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.w}%`,
              height: `${rect.h}%`,
              boxShadow: isPrimary
                ? "0 0 0 2px rgba(255,255,255,0.95), 0 10px 28px rgba(0,0,0,0.22), 0 0 0 9999px rgba(0,0,0,0.42)"
                : "0 0 0 1.5px rgba(255,255,255,0.8), 0 6px 16px rgba(0,0,0,0.16)",
            }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1], delay: index * 0.04 }}
          />
        );
      })}
    </div>
  );
}
