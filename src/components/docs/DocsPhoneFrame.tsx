"use client";

import IPhoneMockup from "@/components/ui/iphone-mockup";
import { DocsBookingMockup } from "./mockups/DocsBookingMockup";

type Props = {
  mockupId: string;
  highlightTarget?: string;
  scale?: number;
};

export function DocsPhoneFrame({ mockupId, highlightTarget, scale = 0.72 }: Props) {
  return (
    <div className="relative mx-auto w-fit">
      <IPhoneMockup model="15" color="black" scale={scale} screenBg="#f2f2f7">
        <div className="relative h-full w-full overflow-hidden">
          <DocsBookingMockup variant={mockupId} highlightTarget={highlightTarget} />
        </div>
      </IPhoneMockup>
    </div>
  );
}
