"use client";

import Image from "next/image";
import type { DashboardNavHighlight, DocsHotspot, DocsMockupTarget } from "@content/docs/types";
import { docsShotShadow, docsStageSurface } from "@/lib/docs/design-tokens";
import { resolveHighlightRects, shotIdFromSrc } from "@/lib/docs/highlight-rects";
import { cn } from "@/lib/utils";
import { DocsHotspot as HotspotOverlay } from "./DocsHotspot";
import { DocsScreenshotHighlight } from "./DocsScreenshotHighlight";

type Props = {
  src: string;
  alt?: string;
  highlightNav?: DashboardNavHighlight;
  highlightTarget?: DocsMockupTarget;
  hotspots?: DocsHotspot[];
  className?: string;
  compact?: boolean;
  staged?: boolean;
};

/**
 * Live product screenshot frame for docs.
 * Source captures are 16:10 — fill the frame edge-to-edge (no letterbox dead space).
 */
export function DocsProductFrame({
  src,
  alt = "Dinaya dashboard",
  highlightNav,
  highlightTarget,
  hotspots = [],
  className,
  compact = false,
  staged = false,
}: Props) {
  const rects = resolveHighlightRects({
    highlightNav,
    highlightTarget,
    shotId: shotIdFromSrc(src),
  });
  const hasHighlight = rects.length > 0;

  const shot = (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-white dark:bg-neutral-900",
        // Captures are 2560×1600 — keep exact ratio so object-cover doesn't crop unevenly
        "aspect-16/10",
        compact ? "rounded-xl" : "rounded-[1.05rem]",
        docsShotShadow,
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        // Exact aspect match → cover equals fill; pin top-left for stable highlight coords
        className="object-cover object-top-left"
        sizes={compact ? "280px" : "(max-width: 768px) 100vw, 720px"}
        priority={!compact}
      />
      {/* Hairline on the media edge only */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
        aria-hidden
      />
      {hasHighlight ? <DocsScreenshotHighlight rects={rects} /> : null}
      {hotspots.map((h, i) => (
        <HotspotOverlay key={`${h.x}-${h.y}-${i}`} hotspot={h} />
      ))}
    </div>
  );

  if (!staged || compact) return shot;

  // Concentric: outer 22px, pad 10px → inner ~12px (1.05rem)
  return (
    <div className={cn("p-2.5 sm:p-[0.65rem]", docsStageSurface, "rounded-[1.35rem] sm:rounded-3xl")}>
      {shot}
    </div>
  );
}
