/**
 * Shared design + motion tokens for the documentation demo system.
 *
 * Centralising these keeps every mockup, frame, and highlight on the same
 * premium visual language: one set of motion curves, one shadow scale, and
 * a small palette of reusable surface classes. Tune here, not per-component.
 */
import type { Transition } from "motion/react";

/** Springy, confident motion for step changes and entrances. */
export const DEMO_SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

/** Calm ease for opacity-only fades. */
export const DEMO_EASE: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

/** Crossfade + lift used when a walkthrough swaps the visual panel. */
export const stepVisualMotion = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.99 },
  transition: DEMO_SPRING,
};

/** Layered, soft shadow that reads as floating glass rather than a flat card. */
export const DEMO_WINDOW_SHADOW =
  "shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.18),0_30px_60px_-30px_rgba(15,23,42,0.28)]";

/** Subtle inner surface used for mockup cards. */
export const DEMO_CARD =
  "rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

/** Tabular numerals so stats and prices stay optically aligned. */
export const DEMO_NUMERALS = "[font-variant-numeric:tabular-nums] tracking-tight";

/** Deterministic avatar gradient from a name — gives mockups a populated feel. */
const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-sky-500 to-cyan-500",
] as const;

export function avatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
