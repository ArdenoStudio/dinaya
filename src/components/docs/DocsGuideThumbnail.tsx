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
          "relative h-32 overflow-hidden rounded-xl bg-[hsl(240_8%_96%)] ring-1 ring-black/[0.06] dark:bg-[hsl(240_5%_8%)] dark:ring-white/[0.08]",
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/[0.06] to-transparent dark:from-black/30" />
      </div>
    );
  }

  if (isBooking) {
    return (
      <div
        className={cn(
          "relative flex h-32 items-end justify-center overflow-hidden rounded-xl bg-[hsl(240_8%_97%)] ring-1 ring-black/[0.06] dark:bg-[hsl(240_5%_8%)] dark:ring-white/[0.08]",
          className,
        )}
      >
        <div className="pointer-events-none origin-bottom translate-y-3 scale-[0.38]">
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
          "relative h-32 overflow-hidden rounded-xl bg-[hsl(240_8%_96%)] ring-1 ring-black/[0.06] dark:bg-[hsl(240_5%_8%)] dark:ring-white/[0.08]",
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
        "flex h-32 items-center justify-center rounded-xl border border-dashed border-black/[0.08] bg-[hsl(240_8%_97%)] text-xs text-muted-foreground dark:border-white/10 dark:bg-[hsl(240_5%_8%)]",
        className,
      )}
    >
      Guide preview
    </div>
  );
}
