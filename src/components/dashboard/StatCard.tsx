import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneClass = {
  amber: "bg-amber-500 text-amber-950",
  cobalt: "bg-primary text-primary-foreground",
  slate: "bg-slate-700 text-white",
  violet: "bg-violet-600 text-white",
};

export function StatCard({
  delta,
  icon: Icon,
  label,
  tone = "cobalt",
  value,
}: {
  delta?: React.ReactNode;
  icon?: LucideIcon;
  label: string;
  tone?: keyof typeof toneClass;
  value: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className={cn("h-1", toneClass[tone])} />
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {delta && <div className="mt-2 text-xs text-muted-foreground">{delta}</div>}
        </div>
        {Icon && (
          <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
