"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

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
      <Icon name={copied ? "check" : "clipboard"} className={`${copied ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"} text-[11px] transition-all`} />
    </button>
  );
}
