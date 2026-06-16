"use client";

import {
  motion,
  useInView,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import { type ElementType, type RefObject } from "react";

import { cn } from "@/lib/utils";

const motionByTag = {
  div: motion.div,
  p: motion.p,
  span: motion.span,
  section: motion.section,
  article: motion.article,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type MotionTag = keyof typeof motionByTag;

type TimelineContentProps = {
  children: React.ReactNode;
  animationNum: number;
  timelineRef: RefObject<HTMLElement | null>;
  customVariants: Variants;
  className?: string;
  as?: MotionTag;
} & Omit<HTMLMotionProps<"div">, "ref" | "variants" | "custom" | "initial" | "animate">;

export function TimelineContent({
  children,
  animationNum,
  timelineRef,
  customVariants,
  className,
  as = "div",
  ...props
}: TimelineContentProps) {
  const isInView = useInView(timelineRef, { once: true, amount: 0.15 });
  const Component = motionByTag[as] as ElementType;

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={customVariants}
      {...props}
    >
      {children}
    </Component>
  );
}
