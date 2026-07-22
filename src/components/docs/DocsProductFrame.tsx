"use client";

import Image from "next/image";
import type { DashboardNavHighlight, DocsHotspot, DocsMockupTarget } from "@content/docs/types";
import { docsShotShadow, docsStageSurface } from "@/lib/docs/design-tokens";
import { resolveHighlightRects } from "@/lib/docs/highlight-rects";
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
  /** Compact hub thumbnail — no stage padding */
  compact?: boolean;
  /** Show soft studio stage around the shot */
  staged?: boolean;
};

/**
 * Live product screenshot frame for docs.
 * Always screenshot-first — no fake browser chrome, no React mockups.
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
  const rects = resolveHighlightRects({ highlightNav, highlightTarget });
  const hasHighlight = rects.length > 0;

  const shot = (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[hsl(240_6%_96%)] dark:bg-[hsl(240_5%_8%)]",
        compact ? "aspect-[16/10] rounded-[0.85rem]" : "aspect-[16/10] rounded-[1.15rem]",
        docsShotShadow,
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover object-left-top outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
        sizes={compact ? "280px" : "(max-width: 768px) 100vw, 640px"}
        priority={!compact}
      />
      {hasHighlight ? <DocsScreenshotHighlight rects={rects} /> : null}
      {hotspots.map((h, i) => (
        <HotspotOverlay key={`${h.x}-${h.y}-${i}`} hotspot={h} />
      ))}
    </div>
  );

  if (!staged || compact) return shot;

  return (
    <div className={cn("p-3 sm:p-5", docsStageSurface)}>
      {shot}
    </div>
  );
}
