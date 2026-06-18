"use client";

import { useTheme } from "next-themes";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { docsFloorShadow } from "@/lib/docs/design-tokens";
import { cn } from "@/lib/utils";
import { DocsBookingMockup } from "./mockups/DocsBookingMockup";
import { DocsSpotlight } from "./DocsSpotlight";

type Props = {
  mockupId: string;
  highlightTarget?: string;
  scale?: number;
  className?: string;
};

export function DocsPhoneFrame({ mockupId, highlightTarget, scale = 0.72, className }: Props) {
  const { resolvedTheme } = useTheme();
  const screenBg = resolvedTheme === "dark" ? "#0a0a0a" : "#f2f2f7";

  return (
    <div className={cn("relative mx-auto w-fit pb-3", className)}>
      <div className={cn("relative", docsFloorShadow, "rounded-[2.5rem]")}>
        <DocsSpotlight active={Boolean(highlightTarget)}>
          <IPhoneMockup model="15" color="black" scale={scale} screenBg={screenBg}>
            <div className="relative h-full w-full overflow-hidden">
              <DocsBookingMockup variant={mockupId} highlightTarget={highlightTarget} />
            </div>
          </IPhoneMockup>
        </DocsSpotlight>
      </div>
    </div>
  );
}
