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
  const screenBg = resolvedTheme === "dark" ? "#0a0a0a" : "#f2f2f7";
  const spotlightActive = Boolean(highlightTarget) && !src;

  return (
    <div className={cn("relative mx-auto w-fit pb-3", className)}>
      <div className={cn("relative", docsFloorShadow, "rounded-[2.5rem]")}>
        <DocsSpotlight active={spotlightActive}>
          <IPhoneMockup model="15" color="black" scale={scale} screenBg={screenBg}>
            <div className="relative h-full w-full overflow-hidden">
              {src ? (
                <>
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover object-top"
                    sizes="390px"
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
