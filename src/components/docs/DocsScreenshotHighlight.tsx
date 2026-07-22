"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { DocsHighlightRect } from "@/lib/docs/highlight-rects";
import { cn } from "@/lib/utils";

type Props = {
  rects: DocsHighlightRect[];
  className?: string;
};

/**
 * SVG mask spotlight — dims the frame and cuts clean rounded windows.
 * No white glow rings (those read as misaligned “pills”).
 */
export function DocsScreenshotHighlight({ rects, className }: Props) {
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const maskId = `docs-hl-${uid}`;

  if (rects.length === 0) return null;

  return (
    <motion.div
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
      aria-hidden
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            {/* White = dim visible; black = clear hole */}
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {rects.map((rect, index) => (
              <rect
                key={`${rect.x}-${rect.y}-${index}`}
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx={1.2}
                ry={1.8}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="rgba(0,0,0,0.42)"
          mask={`url(#${maskId})`}
        />
      </svg>
      {/* DOM keylines stay circular under any aspect ratio */}
      {rects.map((rect, index) => (
        <div
          key={`ring-${rect.x}-${rect.y}-${index}`}
          className="absolute rounded-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]"
          style={{
            left: `${rect.x}%`,
            top: `${rect.y}%`,
            width: `${rect.w}%`,
            height: `${rect.h}%`,
          }}
        />
      ))}
    </motion.div>
  );
}
