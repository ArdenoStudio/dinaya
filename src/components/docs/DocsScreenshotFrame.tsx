"use client";

import Image from "next/image";
import type { DocsHotspot } from "@content/docs/types";
import { Icon } from "@/components/ui/Icon";
import { DocsHotspot as HotspotOverlay } from "./DocsHotspot";
import { DocsDashboardMockup } from "./mockups/DocsDashboardMockup";
import { DEMO_WINDOW_SHADOW } from "./mockups/demo-theme";

type Props = {
  src?: string;
  alt?: string;
  mockupId?: string;
  highlightNav?: string;
  highlightTarget?: string;
  hotspots?: DocsHotspot[];
  url?: string;
  className?: string;
};

function TrafficLight({ className }: { className: string }) {
  return (
    <span
      className={`size-2.5 rounded-full ${className} shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
    />
  );
}

/** A premium macOS-style browser window used to present dashboard demos. */
export function DocsScreenshotFrame({
  src,
  alt = "Dashboard screenshot",
  mockupId,
  highlightNav,
  highlightTarget,
  hotspots = [],
  url = "dinaya.lk/dashboard",
  className,
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200/80 bg-white ring-1 ring-black/[0.03] ${DEMO_WINDOW_SHADOW} ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 border-b border-gray-200/70 bg-gradient-to-b from-gray-50 to-gray-100/80 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <TrafficLight className="bg-[#ff5f57]" />
          <TrafficLight className="bg-[#febc2e]" />
          <TrafficLight className="bg-[#28c840]" />
        </div>
        <div className="ml-1 hidden items-center gap-0.5 text-gray-300 sm:flex">
          <Icon name="chevron-left" className="text-[11px]" />
          <Icon name="chevron-right" className="text-[11px]" />
        </div>
        <div className="mx-auto flex w-full max-w-[230px] items-center justify-center gap-1.5 rounded-lg border border-gray-200/70 bg-white/80 px-2.5 py-1 shadow-[inset_0_1px_1px_rgba(15,23,42,0.03)]">
          <Icon name="lock-fill" className="text-[9px] text-emerald-500" />
          <span className="truncate text-[10px] font-medium text-gray-500">{url}</span>
        </div>
        <div className="ml-auto hidden text-gray-300 sm:block">
          <Icon name="arrow-repeat" className="text-[11px]" />
        </div>
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
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 480px"
            />
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
