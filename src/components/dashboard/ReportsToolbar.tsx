"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export function ReportsToolbar({
  csv,
  filename,
  initialFrom,
  initialTo,
}: {
  csv: string;
  filename: string;
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(() => defaultRange(), []);
  const value = {
    from: searchParams.get("from") ?? initialFrom ?? defaults.from,
    to: searchParams.get("to") ?? initialTo ?? defaults.to,
  };

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <DateRangePicker
        value={value}
        onChange={(next) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("from", next.from);
          params.set("to", next.to);
          startTransition(() => {
            router.push(`/dashboard/reports?${params.toString()}`);
          });
        }}
      />
      <button
        type="button"
        onClick={downloadCsv}
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
      >
        Download CSV
      </button>
    </div>
  );
}
