"use client";

import IPhoneMockup from "@/components/ui/iphone-mockup";
import type { DocsHotspot } from "@content/docs/types";
import { DocsHotspot as HotspotOverlay } from "./DocsHotspot";
import { DocsBookingMockup } from "./mockups/DocsBookingMockup";

type Props = {
  mockupId: string;
  hotspots?: DocsHotspot[];
  scale?: number;
};

export function DocsPhoneFrame({ mockupId, hotspots = [], scale = 0.72 }: Props) {
  return (
    <div className="relative mx-auto w-fit">
      <IPhoneMockup model="15" color="black" scale={scale} screenBg="#f2f2f7">
        <div className="relative h-full w-full overflow-hidden">
          <DocsBookingMockup variant={mockupId} />
          {hotspots.map((h, i) => (
            <HotspotOverlay key={`${h.x}-${h.y}-${i}`} hotspot={h} />
          ))}
        </div>
      </IPhoneMockup>
    </div>
  );
}
