"use client";

import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Soft focus when a walkthrough step highlights a target — chrome recedes, mark stays clear. */
export function DocsSpotlight({ active, children, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative transition-[filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          active && "brightness-[0.94] saturate-[0.9]",
        )}
      >
        {children}
      </div>
      {active ? (
        <div
          className="pointer-events-none absolute inset-0 z-15 rounded-b-[1.25rem] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.08)_100%)]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
