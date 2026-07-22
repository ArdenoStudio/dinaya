"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { docsSpring } from "@/lib/docs/design-tokens";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { DocsProductFrame } from "./DocsProductFrame";

const HERO_SHOTS = ["dashboard-overview", "dashboard-services", "dashboard-marketing"] as const;

export function DocsHeroPreview() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SHOTS.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const mockupId = HERO_SHOTS[reduceMotion ? 0 : index];
  const screenshot = getScreenshotForMockup(mockupId);

  return (
    <div className="relative mx-auto mt-8 max-w-3xl">
      <div
        className="pointer-events-none absolute -inset-x-8 -inset-y-6 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_60%)]"
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mockupId}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={docsSpring}
        >
          <DocsProductFrame
            src={screenshot}
            mockupId={screenshot ? undefined : mockupId}
            alt="Dinaya dashboard"
            variant="shot"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
