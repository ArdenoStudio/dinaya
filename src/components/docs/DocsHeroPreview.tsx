"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { docsSpring } from "@/lib/docs/design-tokens";
import { DocsProductFrame } from "./DocsProductFrame";

const HERO_MOCKUPS = [
  "dashboard-overview",
  "dashboard-bookings",
  "dashboard-marketing",
] as const;

export function DocsHeroPreview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_MOCKUPS.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const mockupId = HERO_MOCKUPS[index];

  return (
    <div className="relative mx-auto mt-6 max-w-2xl">
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-blue-200/20 via-transparent to-transparent dark:from-blue-950/25 blur-2xl" />
      <AnimatePresence mode="wait">
        <motion.div
          key={mockupId}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={docsSpring}
        >
          <DocsProductFrame mockupId={mockupId} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
