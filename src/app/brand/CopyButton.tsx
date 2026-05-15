"use client";

import { useState } from "react";

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
      title={`Copy ${value}`}
    >
      <code className="font-mono">{value}</code>
      <i className={`bi ${copied ? "bi-check text-blue-500" : "bi-clipboard text-gray-400 group-hover:text-gray-600"} text-[11px] transition-all`} />
    </button>
  );
}
