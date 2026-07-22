"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import type { DocsHotspot as DocsHotspotType, DocsMockupTarget } from "@content/docs/types";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { docsFloorShadow, docsStageSurface } from "@/lib/docs/design-tokens";
import { resolveHighlightRects } from "@/lib/docs/highlight-rects";
import { cn } from "@/lib/utils";
import { DocsHotspot } from "./DocsHotspot";
import { DocsScreenshotHighlight } from "./DocsScreenshotHighlight";

type Props = {
  src: string;
  alt?: string;
  highlightTarget?: DocsMockupTarget;
  hotspots?: DocsHotspotType[];
  scale?: number;
  className?: string;
  staged?: boolean;
};

/**
 * Live booking screenshot inside a phone bezel.
 * Screenshot-first — no React booking mockups in user-facing docs.
 */
export function DocsPhoneFrame({
  src,
  alt = "Dinaya booking page",
  highlightTarget,
  hotspots = [],
  scale = 0.78,
  className,
  staged = false,
}: Props) {
  const { resolvedTheme } = useTheme();
  const screenBg = resolvedTheme === "dark" ? "#0a0a0a" : "#f6f7fb";
  const rects = resolveHighlightRects({ highlightTarget });

  const phone = (
    <div className={cn("relative mx-auto w-fit", className)}>
      <div className={cn("relative rounded-[2.6rem]", docsFloorShadow)}>
        <IPhoneMockup
          model="15"
          color="black"
          scale={scale}
          screenBg={screenBg}
          safeArea={false}
          showHomeIndicator={false}
          showDynamicIsland
          shadow={false}
        >
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              className="object-contain object-top"
              sizes="393px"
            />
            {rects.length > 0 ? <DocsScreenshotHighlight rects={rects} /> : null}
            {hotspots.map((h, i) => (
              <DocsHotspot key={`${h.x}-${h.y}-${i}`} hotspot={h} />
            ))}
          </div>
        </IPhoneMockup>
      </div>
    </div>
  );

  if (!staged) return phone;

  return (
    <div className={cn("flex justify-center px-4 py-6 sm:px-8 sm:py-8", docsStageSurface)}>
      {phone}
    </div>
  );
}
