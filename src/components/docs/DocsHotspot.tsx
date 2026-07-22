"use client";

import type { DocsHotspot as HotspotConfig } from "@content/docs/types";

type Props = {
  hotspot: HotspotConfig;
};

/** Minimal mark for legacy %-coord hotspots — no cartoon cursor. */
export function DocsHotspot({ hotspot }: Props) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <span className="relative block size-3 rounded-full bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.55),0_0_0_5px_rgba(255,255,255,0.35)]" />
      {hotspot.label ? (
        <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-950/90 px-2 py-0.5 text-[10px] font-medium tracking-tight text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {hotspot.label}
        </span>
      ) : null}
    </div>
  );
}
