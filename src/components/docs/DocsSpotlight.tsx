"use client";

import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Vignette + dim when a walkthrough step highlights a target (Intercom-style focus). */
export function DocsSpotlight({ active, children, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative transition-[filter,opacity] duration-300",
          active && "brightness-[0.92] saturate-[0.85]",
        )}
      >
        {children}
      </div>
      {active ? (
        <div
          className="pointer-events-none absolute inset-0 z-[15] rounded-b-2xl bg-gradient-to-b from-gray-900/5 via-transparent to-gray-900/10"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
