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
    }, 5600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const mockupId = HERO_SHOTS[reduceMotion ? 0 : index];
  const screenshot = getScreenshotForMockup(mockupId);

  return (
    <div className="relative mx-auto mt-9 max-w-3xl">
      {/* Atmosphere — soft light falloff, no purple/blue glow */}
      <div
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[2.75rem] bg-[radial-gradient(ellipse_at_50%_0%,hsl(220_12%_70%/_0.18),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,hsl(220_10%_100%/_0.06),transparent_62%)]"
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mockupId}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
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
      {!reduceMotion ? (
        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {HERO_SHOTS.map((id, i) => (
            <span
              key={id}
              className={`h-1 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                i === index ? "w-5 bg-foreground/55" : "w-1 bg-foreground/15"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
