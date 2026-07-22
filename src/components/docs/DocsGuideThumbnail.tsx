"use client";

import Image from "next/image";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { cn } from "@/lib/utils";

type Props = {
  mockupId?: string;
  screenshotSrc?: string;
  className?: string;
};

/**
 * Hub / related-guide thumbnail — bare product crop, no nested chrome or scale hacks.
 */
export function DocsGuideThumbnail({ mockupId, screenshotSrc, className }: Props) {
  const isBooking = mockupId?.startsWith("booking-");
  const screenshot = screenshotSrc ?? (mockupId ? getScreenshotForMockup(mockupId) : undefined);

  if (!screenshot) {
    return (
      <div
        className={cn(
          "flex h-32 items-center justify-center rounded-[0.9rem] bg-[hsl(240_6%_96%)] text-xs text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.06)] dark:bg-[hsl(240_5%_8%)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
          className,
        )}
      >
        Guide preview
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-32 overflow-hidden rounded-[0.9rem] bg-[hsl(240_6%_96%)]",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:bg-[hsl(240_5%_8%)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
        className,
      )}
    >
      <Image
        src={screenshot}
        alt=""
        fill
        unoptimized
        className={cn(
          isBooking ? "object-cover object-top" : "object-cover object-left-top",
          "outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        )}
        sizes="280px"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/[0.08] via-black/[0.02] to-transparent dark:from-black/45"
        aria-hidden
      />
    </div>
  );
}
