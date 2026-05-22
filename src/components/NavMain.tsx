"use client";

import { motion } from "motion/react";
import { useNav } from "@/context/NavContext";

const ENERGY: [number, number, number, number] = [0.32, 0.72, 0, 1];
const DRAWER_W = "min(30rem, 85vw)";

export function NavMain({ children }: { children: React.ReactNode }) {
  const { isOpen } = useNav();

  return (
    <motion.main
      id="main-content"
      animate={{ x: isOpen ? `calc(${DRAWER_W} * -1)` : 0 }}
      transition={{ duration: 0.7, ease: ENERGY }}
      style={{ willChange: "transform", position: "relative" }}
    >
      {children}
    </motion.main>
  );
}
