"use client";

import { m } from "motion/react";
import type { MotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GridArea = "meta" | "main" | "timeslots";

interface BookingPanelProps extends MotionProps {
  area: GridArea;
  visible?: boolean;
  className?: string;
  children: ReactNode;
}

const AREA_CLASS: Record<GridArea, string> = {
  meta: "[grid-area:meta]",
  main: "[grid-area:main]",
  timeslots: "[grid-area:timeslots]",
};

export function BookingPanel({ area, visible, className, children, ...motionProps }: BookingPanelProps) {
  if (visible === false) return null;
  return (
    <m.div className={cn(AREA_CLASS[area], className)} layout {...motionProps}>
      {children}
    </m.div>
  );
}
