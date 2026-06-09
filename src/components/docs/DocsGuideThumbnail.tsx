"use client";

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

  if (screenshot && !isBooking) {
    return (
      <div
        className={cn(
          "relative h-32 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50 shadow-inner",
          className,
        )}
      >
        <DocsProductFrame src={screenshot} compact className="pointer-events-none h-full border-0 shadow-none" />
      </div>
    );
  }

  if (isBooking && mockupId) {
    return (
      <div
        className={cn(
          "relative flex h-32 items-end justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gradient-to-b from-slate-50 to-white",
          className,
        )}
      >
        <div className="pointer-events-none origin-bottom scale-[0.42]">
          <DocsPhoneFrame mockupId={mockupId} scale={0.55} />
        </div>
      </div>
    );
  }

  if (mockupId) {
    return (
      <div
        className={cn(
          "relative h-32 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50",
          className,
        )}
      >
        <div className="pointer-events-none origin-top-left scale-[0.48]">
          <DocsProductFrame mockupId={mockupId} compact className="w-[208%] border-0 shadow-none" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 text-xs text-muted-foreground",
        className,
      )}
    >
      Guide preview
    </div>
  );
}
