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
  highlightTarget?: string;
  hotspots?: DocsHotspot[];
  className?: string;
};

export function DocsScreenshotFrame({
  src,
  alt = "Dashboard screenshot",
  mockupId,
  highlightNav,
  highlightTarget,
  hotspots = [],
  className,
}: Props) {
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
      {mockupId ? (
        <div className="relative w-full bg-white">
          <DocsDashboardMockup
            variant={mockupId}
            highlightNav={highlightNav}
            highlightTarget={highlightTarget}
          />
        </div>
      ) : (
        <div className="relative aspect-[16/10] w-full bg-white">
          {src ? (
            <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 480px" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview
            </div>
          )}
          {hotspots.map((h, i) => (
            <HotspotOverlay key={`${h.x}-${h.y}-${i}`} hotspot={h} />
          ))}
        </div>
      )}
    </div>
  );
}
