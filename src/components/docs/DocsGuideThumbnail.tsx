"use client";

import Image from "next/image";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { cn } from "@/lib/utils";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsProductFrame } from "./DocsProductFrame";

type Props = {
  mockupId?: string;
  screenshotSrc?: string;
  className?: string;
};

export function DocsGuideThumbnail({ mockupId, screenshotSrc, className }: Props) {
  const isBooking = mockupId?.startsWith("booking-");
  const screenshot = screenshotSrc ?? (mockupId ? getScreenshotForMockup(mockupId) : undefined);

  // Hub cards: bare product shot — no nested browser chrome.
  if (screenshot && !isBooking) {
    return (
      <div
        className={cn(
          "relative h-32 overflow-hidden rounded-[0.9rem] bg-[hsl(240_6%_96%)]",
          "outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
          "dark:bg-[hsl(240_5%_8%)]",
          className,
        )}
      >
        <Image
          src={screenshot}
          alt=""
          fill
          unoptimized
          className="object-cover object-left-top"
          sizes="280px"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/[0.07] via-black/[0.02] to-transparent dark:from-black/40"
          aria-hidden
        />
      </div>
    );
  }

  if (isBooking) {
    return (
      <div
        className={cn(
          "relative flex h-32 items-end justify-center overflow-hidden rounded-[0.9rem] bg-[hsl(240_6%_97%)]",
          "outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
          "dark:bg-[hsl(240_5%_8%)]",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,hsl(0_0%_100%/_0.9),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_50%_20%,hsl(0_0%_100%/_0.04),transparent_70%)]"
          aria-hidden
        />
        <div className="pointer-events-none relative origin-bottom translate-y-2 scale-[0.36]">
          <DocsPhoneFrame
            mockupId={screenshot ? undefined : mockupId}
            src={screenshot}
            scale={0.62}
          />
        </div>
      </div>
    );
  }

  if (mockupId) {
    return (
      <div
        className={cn(
          "relative h-32 overflow-hidden rounded-[0.9rem] bg-[hsl(240_6%_96%)]",
          "outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
          "dark:bg-[hsl(240_5%_8%)]",
          className,
        )}
      >
        <div className="pointer-events-none origin-top-left scale-[0.48]">
          <DocsProductFrame
            mockupId={mockupId}
            compact
            className="w-[208%] border-0 shadow-none ring-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-32 items-center justify-center rounded-[0.9rem] border border-dashed border-black/[0.08] bg-[hsl(240_6%_97%)] text-xs text-muted-foreground dark:border-white/10 dark:bg-[hsl(240_5%_8%)]",
        className,
      )}
    >
      Guide preview
    </div>
  );
}
