"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardInputClass } from "@/lib/dashboard-ui";

type DashboardCopyFieldProps = {
  label: string;
  value: string;
  className?: string;
  rows?: number;
  mono?: boolean;
};

export function DashboardCopyField({
  label,
  value,
  className,
  rows = 3,
  mono = true,
}: DashboardCopyFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          className="h-8 gap-1.5"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <textarea
        readOnly
        value={value}
        rows={rows}
        className={cn(
          dashboardInputClass,
          "mt-0 h-auto resize-none",
          mono && "font-mono text-xs",
        )}
      />
    </div>
  );
}
