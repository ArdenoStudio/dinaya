"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AnimatePresence, m } from "motion/react";
import { useState, type KeyboardEvent } from "react";

export interface AvatarUser {
  id: string | number;
  name?: string;
  image?: string | null;
}

interface UserAvatarsProps {
  users: AvatarUser[];
  size?: number | string;
  className?: string;
  maxVisible?: number;
  overlap?: number;
  focusScale?: number;
  isRightToLeft?: boolean;
  isOverlapOnly?: boolean;
  tooltipPlacement?: "top" | "bottom";
  /** Disable per-avatar focus/hover — use inside buttons or other interactive parents */
  decorative?: boolean;
}

export function UserAvatars({
  users,
  size = 56,
  className,
  maxVisible = 7,
  isRightToLeft = false,
  isOverlapOnly = false,
  overlap = 60,
  focusScale = 1.2,
  tooltipPlacement = "bottom",
  decorative = false,
}: UserAvatarsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  const slicedUsers = users.slice(0, Math.min(maxVisible + 1, users.length + 1));
  const exceedMaxLength = users.length > maxVisible;
  const overlapOnly = isOverlapOnly || decorative;

  const handleKeyEnter = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      setHoveredIndex(index);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center",
        decorative && "pointer-events-none",
        className,
      )}
      aria-hidden={decorative || undefined}
    >
      {slicedUsers.map((user, index) => {
        const isHoveredOne = !decorative && hoveredIndex === index;
        const isLengthBubble = exceedMaxLength && maxVisible === index;

        const diff = 1 - overlap / 100;
        const zIndex =
          isHoveredOne && overlapOnly
            ? slicedUsers.length
            : isRightToLeft
              ? slicedUsers.length - index
              : index;

        const shouldScale =
          isHoveredOne && (!exceedMaxLength || slicedUsers.length - 1 !== index);

        const shouldShift =
          hoveredIndex !== null &&
          (isRightToLeft ? index < hoveredIndex : index > hoveredIndex) &&
          !overlapOnly;

        const baseGap = Number(size) * (overlap / 100);
        const neededGap = (Number(size) * (1 + focusScale)) / 2;
        const shift = Math.max(0, neededGap - baseGap);

        const initial = (user.name || "?").trim().charAt(0).toUpperCase() || "?";

        return (
          <m.div
            key={user.id}
            role={decorative ? undefined : "img"}
            aria-label={decorative ? undefined : user.name || "User avatar"}
            className={cn(
              "relative rounded-full outline-none",
              !decorative && "cursor-pointer focus:ring-2 focus:ring-[var(--booking-accent-soft)] focus:ring-offset-2 focus:ring-offset-background",
            )}
            style={{
              width: size,
              height: size,
              zIndex,
              marginLeft: index === 0 ? 0 : -Number(size) * diff,
            }}
            tabIndex={decorative ? undefined : 0}
            onMouseEnter={decorative ? undefined : () => setHoveredIndex(index)}
            onMouseLeave={decorative ? undefined : () => setHoveredIndex(null)}
            onFocus={decorative ? undefined : () => setHoveredIndex(index)}
            onBlur={decorative ? undefined : () => setHoveredIndex(null)}
            onKeyDown={decorative ? undefined : (e) => handleKeyEnter(e, index)}
            animate={
              reducedMotion
                ? { scale: 1, x: 0 }
                : {
                    scale: shouldScale ? focusScale : 1,
                    x: shouldShift ? shift * (isRightToLeft ? -1 : 1) : 0,
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 200, damping: 20 }
            }
          >
            <div className="h-full w-full overflow-hidden rounded-full border-2 border-background shadow-sm ring-1 ring-border/50">
              {isLengthBubble ? (
                <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-semibold text-muted-foreground">
                  +{users.length - maxVisible}
                </div>
              ) : user.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- small decorative avatars; external tenant URLs
                <img
                  src={user.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--booking-accent-muted)] text-xs font-semibold text-[var(--booking-accent)]">
                  {initial}
                </div>
              )}
            </div>

            <AnimatePresence>
              {!decorative && shouldScale && user.name ? (
                <m.div
                  role="tooltip"
                  initial={{
                    opacity: 0,
                    y: tooltipPlacement === "bottom" ? 8 : -8,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: tooltipPlacement === "bottom" ? 8 : -8,
                  }}
                  transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  className={cn(
                    "absolute left-1/2 z-50",
                    tooltipPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
                  )}
                >
                  <div className="-translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg">
                    {user.name}
                  </div>
                </m.div>
              ) : null}
            </AnimatePresence>
          </m.div>
        );
      })}
    </div>
  );
}
