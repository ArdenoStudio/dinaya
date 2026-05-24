"use client";

import { motion } from "motion/react";

type Props = {
  className?: string;
};

export function DocsCursor({ className }: Props) {
  return (
    <motion.div
      className={`pointer-events-none z-20 ${className ?? ""}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        animate={{ scale: [1, 0.92, 1] }}
        transition={{ duration: 0.6, delay: 0.2, repeat: Infinity, repeatDelay: 2.5 }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-md"
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
        animate={{ scale: [0, 2.2], opacity: [0.8, 0] }}
        transition={{ duration: 0.5, delay: 0.45, repeat: Infinity, repeatDelay: 2.5 }}
      />
    </motion.div>
  );
}
