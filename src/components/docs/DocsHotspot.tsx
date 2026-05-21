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
      <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-primary/25" />
      <span className="relative block size-8 rounded-full border-2 border-primary bg-primary/10 ring-4 ring-primary/20" />
      {hotspot.label ? (
        <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-lg">
          {hotspot.label}
        </span>
      ) : null}
      {hotspot.showCursor !== false ? (
        <DocsCursor className="absolute -left-1 -top-1" />
      ) : null}
    </div>
  );
}
