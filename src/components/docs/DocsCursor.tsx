"use client";

import { motion } from "motion/react";

type Props = {
  className?: string;
};

/** Animated pointer with a soft glow + click ripple, used to draw the eye to a target. */
export function DocsCursor({ className }: Props) {
  return (
    <motion.div
      className={`pointer-events-none z-20 ${className ?? ""}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.span
        aria-hidden
        className="absolute -left-1 -top-1 size-9 rounded-full bg-primary/15 blur-[2px]"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        animate={{ scale: [1, 0.9, 1], y: [0, 1.5, 0] }}
        transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="relative drop-shadow-[0_2px_4px_rgba(15,23,42,0.35)]"
          aria-hidden
        >
          <path
            d="M5 3L19 12L11 13.5L9 21L5 3Z"
            fill="#111827"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <motion.span
        className="absolute left-6 top-5 size-3 rounded-full bg-primary/40"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: [0, 2.4], opacity: [0.8, 0] }}
        transition={{ duration: 0.5, delay: 0.45, repeat: Infinity, repeatDelay: 2.5 }}
      />
    </motion.div>
  );
}
