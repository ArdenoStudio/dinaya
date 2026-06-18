"use client";

import { useState } from "react";

type Swatch = { shade: string; hex: string; light: boolean };

function SwatchItem({ swatch }: { swatch: Swatch }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(swatch.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="flex-1 flex flex-col justify-end p-3 cursor-pointer group min-h-[148px]"
      style={{ backgroundColor: swatch.hex }}
      onClick={copy}
      title={`Copy ${swatch.hex}`}
    >
      <p className={`font-bold text-sm mb-0.5 ${swatch.light ? "text-gray-900 dark:text-gray-100" : "text-white"}`}>
        {swatch.shade}
      </p>
      <p className={`font-mono text-[11px] mb-2 ${swatch.light ? "text-gray-600 dark:text-gray-400" : "text-white/70"}`}>
        {swatch.hex.toUpperCase()}
      </p>
      <span
        className={`inline-block w-fit text-[11px] font-medium px-2.5 py-1 rounded-full transition-all
          ${copied
            ? "bg-black text-white opacity-100"
            : "bg-black text-white opacity-0 group-hover:opacity-100"
          }`}
      >
        {copied ? "Copied" : "Copy"}
      </span>
    </div>
  );
}

export default function ColorScale({ label, swatches }: { label: string; swatches: Swatch[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">{label}</p>
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800">
        {swatches.map((s) => (
          <SwatchItem key={s.shade} swatch={s} />
        ))}
      </div>
    </div>
  );
}
