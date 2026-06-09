"use client";

import { cn } from "@/lib/utils";
import { DocsCursor } from "./DocsCursor";

type Props = {
  active: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
  /** block = full-width rows; inline = chips and buttons */
  variant?: "block" | "inline";
  /** Where the cursor sits relative to the target */
  placement?: "right" | "below";
};

/** Attaches cursor + ring to the actual mockup element (not %-positioned overlays). */
export function DocsTargetHighlight({
  active,
  label,
  children,
  className,
  variant = "block",
  placement,
}: Props) {
  const cursorPlacement = placement ?? (variant === "inline" ? "below" : "right");

  return (
    <span
      className={cn(
        "relative",
        variant === "block" && "block",
        variant === "inline" && "inline-flex",
        className,
      )}
    >
      {children}
      {active ? (
        <>
          <span
            className="pointer-events-none absolute inset-0 -m-0.5 z-10 rounded-md ring-2 ring-primary ring-offset-2 ring-offset-white shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
            aria-hidden
          />
          {cursorPlacement === "right" ? (
            <span className="pointer-events-none absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 translate-x-1 items-center">
              <DocsCursor className="relative shrink-0" />
              {label ? (
                <span className="ml-1 whitespace-nowrap rounded-md bg-gray-950 px-2 py-0.5 font-cal text-[9px] font-medium text-white shadow-lg">
                  {label}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 flex -translate-x-1/2 flex-col items-center">
              <DocsCursor className="relative shrink-0" />
              {label ? (
                <span className="mt-0.5 whitespace-nowrap rounded-md bg-gray-950 px-2 py-0.5 font-cal text-[9px] font-medium text-white shadow-lg">
                  {label}
                </span>
              ) : null}
            </span>
          )}
        </>
      ) : null}
    </span>
  );
}
