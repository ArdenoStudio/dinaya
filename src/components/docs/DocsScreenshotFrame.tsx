"use client";

import Image from "next/image";
import type { DocsHotspot } from "@content/docs/types";
import { DocsHotspot as HotspotOverlay } from "./DocsHotspot";
import { DocsDashboardMockup } from "./mockups/DocsDashboardMockup";

type Props = {
  src?: string;
  alt?: string;
  mockupId?: string;
  highlightNav?: string;
  hotspots?: DocsHotspot[];
  className?: string;
};

/** Sidebar is ~31% wide — only overlay hotspots in the main panel when nav is highlighted. */
const MAIN_PANEL_MIN_X = 38;

export function DocsScreenshotFrame({
  src,
  alt = "Dashboard screenshot",
  mockupId,
  highlightNav,
  hotspots = [],
  className,
}: Props) {
  const overlayHotspots = highlightNav
    ? hotspots.filter((h) => h.x >= MAIN_PANEL_MIN_X)
    : hotspots;
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-gray-50 shadow-lg shadow-gray-900/5 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 border-b bg-gray-100 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] text-gray-500">dinaya.lk/dashboard</span>
      </div>
      <div className="relative min-h-[320px] w-full bg-white">
        {mockupId ? (
          <div className="absolute inset-0">
            <DocsDashboardMockup variant={mockupId} highlightNav={highlightNav} />
          </div>
        ) : src ? (
          <div className="relative aspect-[16/10] w-full">
            <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 480px" />
          </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
            Preview
          </div>
        )}
        {overlayHotspots.map((h, i) => (
          <HotspotOverlay key={`${h.x}-${h.y}-${i}`} hotspot={h} />
        ))}
      </div>
    </div>
  );
}
