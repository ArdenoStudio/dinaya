"use client";

import React from "react";

import { cn } from "@/lib/utils";

export interface WordRotateProps {
  words: string[];
  duration?: number;
  className?: string;
}

/** Lightweight word cycle — first word is visible on SSR (no Motion / blur). */
export function WordRotate({
  words,
  className,
  duration = 3000,
}: WordRotateProps) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const fadeOutMs = 180;
    let innerId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      innerId = window.setTimeout(() => {
        setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
        setVisible(true);
      }, fadeOutMs);
    }, duration);
    return () => {
      window.clearTimeout(timeoutId);
      if (innerId !== undefined) window.clearTimeout(innerId);
    };
  }, [index, words.length, duration]);

  return (
    <span
      className={cn(
        "inline-block overflow-hidden align-bottom pb-1 -mb-1 transition-opacity duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {words[index]}
    </span>
  );
}
