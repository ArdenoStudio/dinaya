"use client";

import type { MotionProps } from "motion/react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GridArea = "meta" | "main" | "timeslots";

interface BookingPanelProps extends MotionProps {
  area: GridArea;
  visible?: boolean;
  className?: string;
  children: ReactNode;
}

function hasMotionProps(props: MotionProps): boolean {
  if (
    props.initial === false &&
    props.animate === undefined &&
    props.variants === undefined &&
    props.exit === undefined
  ) {
    return false;
  }
  return (
    props.animate !== undefined ||
    props.variants !== undefined ||
    props.initial !== undefined ||
    props.exit !== undefined
  );
}

export function BookingPanel({ area, visible, className, children, ...motionProps }: BookingPanelProps) {
  if (visible === false) return null;

  const classNames = cn(
    area === "meta" && "min-w-0 lg:col-start-1",
    area === "main" && "min-w-0 lg:col-start-2",
    className,
  );

  if (!hasMotionProps(motionProps)) {
    return <div className={classNames}>{children}</div>;
  }

  return (
    <m.div className={classNames} layout="position" {...motionProps}>
      {children}
    </m.div>
  );
}
