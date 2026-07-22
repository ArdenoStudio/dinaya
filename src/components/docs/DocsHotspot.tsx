"use client";

import type { DocsHotspot as HotspotConfig } from "@content/docs/types";
import { DocsCursor } from "./DocsCursor";

type Props = {
  hotspot: HotspotConfig;
};

export function DocsHotspot({ hotspot }: Props) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <span className="relative block size-5 rounded-full border-2 border-primary bg-white/90 shadow-[0_0_0_4px_hsl(var(--primary)/0.18)] motion-reduce:shadow-none" />
      {hotspot.label ? (
        <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-950 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg">
          {hotspot.label}
        </span>
      ) : null}
      {hotspot.showCursor !== false ? (
        <DocsCursor className="absolute -left-1 -top-1" />
      ) : null}
    </div>
  );
}
