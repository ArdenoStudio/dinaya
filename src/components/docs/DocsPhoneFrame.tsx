"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { docsFloorShadow } from "@/lib/docs/design-tokens";
import { cn } from "@/lib/utils";
import { DocsBookingMockup } from "./mockups/DocsBookingMockup";
import { DocsHotspot } from "./DocsHotspot";
import { DocsSpotlight } from "./DocsSpotlight";
import type { DocsHotspot as DocsHotspotType } from "@content/docs/types";

type Props = {
  mockupId?: string;
  /** Real mobile screenshot — preferred over React booking mockup when set. */
  src?: string;
  alt?: string;
  highlightTarget?: string;
  hotspots?: DocsHotspotType[];
  scale?: number;
  className?: string;
};

export function DocsPhoneFrame({
  mockupId,
  src,
  alt = "Dinaya booking page",
  highlightTarget,
  hotspots = [],
  scale = 0.72,
  className,
}: Props) {
  const { resolvedTheme } = useTheme();
  const screenBg = resolvedTheme === "dark" ? "#0a0a0a" : "#f6f7fb";
  const isShot = Boolean(src);
  const spotlightActive = Boolean(highlightTarget) && !isShot;

  return (
    <div className={cn("relative mx-auto w-fit pb-4", className)}>
      <div
        className={cn(
          "relative rounded-[2.6rem]",
          docsFloorShadow,
          // Soft contact shadow under the device — reads as resting on surface
          "after:pointer-events-none after:absolute after:inset-x-[18%] after:-bottom-2 after:h-3 after:rounded-full after:bg-black/10 after:blur-md after:content-[''] dark:after:bg-black/40",
        )}
      >
        <DocsSpotlight active={spotlightActive}>
          <IPhoneMockup
            model="15"
            color="black"
            scale={scale}
            screenBg={screenBg}
            safeArea={!isShot}
            showHomeIndicator={!isShot}
            showDynamicIsland
          >
            <div className="relative h-full w-full overflow-hidden">
              {src ? (
                <>
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    unoptimized
                    className="object-cover object-top"
                    sizes="393px"
                  />
                  {hotspots.map((h, i) => (
                    <DocsHotspot key={`${h.x}-${h.y}-${i}`} hotspot={h} />
                  ))}
                </>
              ) : mockupId ? (
                <DocsBookingMockup variant={mockupId} highlightTarget={highlightTarget} />
              ) : null}
            </div>
          </IPhoneMockup>
        </DocsSpotlight>
      </div>
    </div>
  );
}
