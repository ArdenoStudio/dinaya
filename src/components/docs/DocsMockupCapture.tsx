"use client";

/**
 * Capture / internal preview only — React mockups with optional browser chrome.
 * User-facing docs always use DocsProductFrame / DocsPhoneFrame with live screenshots.
 */

import Image from "next/image";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { docsFrameShadow } from "@/lib/docs/design-tokens";
import { getScreenshotForMockup } from "@/lib/docs/visuals";
import { cn } from "@/lib/utils";
import { DocsPhoneFrame } from "./DocsPhoneFrame";
import { DocsBookingMockup } from "./mockups/DocsBookingMockup";
import { DocsDashboardMockup } from "./mockups/DocsDashboardMockup";

const lights = {
  close: "#ff5f57",
  minimize: "#febc2e",
  zoom: "#28c840",
} as const;

type Props = {
  mockupId: string;
  scale?: number;
};

export function DocsMockupCapture({ mockupId, scale = 0.85 }: Props) {
  const isBooking = mockupId.startsWith("booking-");
  const screenshot = getScreenshotForMockup(mockupId);

  if (screenshot && isBooking) {
    return <DocsPhoneFrame src={screenshot} scale={scale} />;
  }

  if (screenshot && !isBooking) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-neutral-900",
          docsFrameShadow,
        )}
      >
        <BrowserChrome />
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={screenshot}
            alt=""
            fill
            unoptimized
            className="object-cover object-left-top"
            sizes="1280px"
          />
        </div>
      </div>
    );
  }

  if (isBooking) {
    return (
      <IPhoneMockup
        model="15"
        color="black"
        scale={scale}
        showDynamicIsland
        safeArea
        showHomeIndicator
      >
        <DocsBookingMockup variant={mockupId} />
      </IPhoneMockup>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08]",
        docsFrameShadow,
      )}
    >
      <BrowserChrome />
      <DocsDashboardMockup variant={mockupId} />
    </div>
  );
}

function BrowserChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-black/[0.05] bg-[hsl(var(--dashboard-chrome))]/90 px-3 py-2 dark:border-white/[0.07]">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: lights.close }} />
      <span className="size-2.5 rounded-full" style={{ backgroundColor: lights.minimize }} />
      <span className="size-2.5 rounded-full" style={{ backgroundColor: lights.zoom }} />
      <div className="ml-1 flex min-w-0 flex-1 items-center rounded-md border border-black/[0.05] bg-white/85 px-2 py-0.5 dark:border-white/[0.08] dark:bg-neutral-800/90">
        <span className="truncate font-mono text-[10px] text-gray-500">dilini.dinaya.lk/dashboard</span>
      </div>
    </div>
  );
}
