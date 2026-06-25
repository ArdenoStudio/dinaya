"use client";

import Image from "next/image";
import type { DocsHotspot } from "@content/docs/types";
import { docsFrameShadow } from "@/lib/docs/design-tokens";
import { cn } from "@/lib/utils";
import { DocsHotspot as HotspotOverlay } from "./DocsHotspot";
import { DocsDashboardMockup } from "./mockups/DocsDashboardMockup";
import { DocsSpotlight } from "./DocsSpotlight";

type Props = {
  src?: string;
  alt?: string;
  mockupId?: string;
  highlightNav?: string;
  highlightTarget?: string;
  hotspots?: DocsHotspot[];
  className?: string;
  /** Scaled preview for guide cards */
  compact?: boolean;
};

export function DocsProductFrame({
  src,
  alt = "Dinaya dashboard",
  mockupId,
  highlightNav,
  highlightTarget,
  hotspots = [],
  className,
  compact = false,
}: Props) {
  const spotlightActive = Boolean(highlightNav || highlightTarget);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800/90 bg-white dark:bg-neutral-900",
        docsFrameShadow,
        compact && "rounded-xl",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-gray-200 dark:border-neutral-800/80 bg-gradient-to-b from-gray-50 to-gray-100/80 dark:from-neutral-900 dark:to-neutral-950 px-3",
          compact ? "py-1.5" : "py-2",
        )}
      >
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-200 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-800/90 px-2 py-0.5">
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          <span className={cn("truncate font-mono text-gray-500 dark:text-gray-400", compact ? "text-[8px]" : "text-[10px]")}>
            dinaya.lk/dashboard
          </span>
        </div>
      </div>

      {mockupId ? (
        <DocsSpotlight active={spotlightActive && !compact}>
          <div className="relative w-full bg-white dark:bg-neutral-950">
            <DocsDashboardMockup
              variant={mockupId}
              highlightNav={compact ? undefined : highlightNav}
              highlightTarget={compact ? undefined : highlightTarget}
            />
          </div>
        </DocsSpotlight>
      ) : (
        <div className="relative aspect-[16/10] w-full bg-white dark:bg-neutral-950">
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-top image-depth"
              sizes={compact ? "200px" : "(max-width: 768px) 100vw, 480px"}
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
