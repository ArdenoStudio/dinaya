"use client";

import Image from "next/image";
import type { DocsHotspot } from "@content/docs/types";
import {
  docsFrameShadow,
  docsShotShadow,
  docsTrafficLights,
} from "@/lib/docs/design-tokens";
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
  /**
   * `browser` — macOS chrome around React mockups.
   * `shot` — deference framing for live screenshots (no fake URL bar).
   */
  variant?: "browser" | "shot";
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
  variant,
}: Props) {
  const mode = variant ?? (src && !mockupId ? "shot" : "browser");
  const spotlightActive = Boolean(highlightNav || highlightTarget);
  const isShot = mode === "shot";

  return (
    <div
      className={cn(
        "overflow-hidden bg-white dark:bg-neutral-900",
        isShot
          ? cn(
              "rounded-[1.25rem] ring-1 ring-black/[0.06] dark:ring-white/[0.08]",
              docsShotShadow,
              compact && "rounded-xl",
            )
          : cn(
              "rounded-2xl border border-black/[0.06] dark:border-white/[0.08]",
              docsFrameShadow,
              compact && "rounded-xl",
            ),
        className,
      )}
    >
      {!isShot ? (
        <div
          className={cn(
            "flex items-center gap-2 border-b border-black/[0.06] bg-[hsl(var(--dashboard-chrome))]/95 px-3 dark:border-white/[0.08]",
            compact ? "py-1.5" : "py-2",
          )}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: docsTrafficLights.close }}
          />
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: docsTrafficLights.minimize }}
          />
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: docsTrafficLights.zoom }}
          />
          <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-black/[0.06] bg-white/90 px-2 py-0.5 dark:border-white/[0.08] dark:bg-neutral-800/90">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span
              className={cn(
                "truncate font-mono text-gray-500 dark:text-gray-400",
                compact ? "text-[8px]" : "text-[10px]",
              )}
            >
              dinaya.lk/dashboard
            </span>
          </div>
        </div>
      ) : null}

      {mockupId ? (
        <DocsSpotlight active={spotlightActive && !compact}>
          <div className="relative w-full bg-[hsl(var(--dashboard-main))]">
            <DocsDashboardMockup
              variant={mockupId}
              highlightNav={compact ? undefined : highlightNav}
              highlightTarget={compact ? undefined : highlightTarget}
            />
          </div>
        </DocsSpotlight>
      ) : (
        <div
          className={cn(
            "relative w-full bg-[hsl(240_8%_96%)] dark:bg-[hsl(240_5%_8%)]",
            isShot ? "aspect-[16/10]" : "aspect-[16/10]",
          )}
        >
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              className={cn(
                "image-depth",
                isShot ? "object-cover object-left-top" : "object-cover object-top",
              )}
              sizes={compact ? "220px" : "(max-width: 768px) 100vw, 560px"}
              priority={!compact}
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
