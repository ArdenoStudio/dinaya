import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  amber: {
    bar: "bg-amber-500",
    icon: "bg-amber-50 text-amber-600",
  },
  cobalt: {
    bar: "bg-primary",
    icon: "bg-blue-50 text-primary",
  },
  slate: {
    bar: "bg-slate-500",
    icon: "bg-slate-100 text-slate-600",
  },
  violet: {
    bar: "bg-violet-600",
    icon: "bg-violet-50 text-violet-600",
  },
};

function parseDelta(delta?: React.ReactNode): {
  isUp: boolean | null;
  text: React.ReactNode;
} {
  if (!delta) return { isUp: null, text: null };
  if (typeof delta === "string") {
    if (delta.startsWith("+")) return { isUp: true, text: delta };
    if (delta.startsWith("-")) return { isUp: false, text: delta };
  }
  return { isUp: null, text: delta };
}

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
  tone?: keyof typeof toneStyles;
  value: React.ReactNode;
}) {
  const styles = toneStyles[tone];
  const { isUp, text: deltaText } = parseDelta(delta);

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className={cn("h-1", styles.bar)} />
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {delta && (
            <div className="mt-2 flex items-center gap-1">
              {isUp === true && <TrendingUp className="size-3 text-green-600" aria-hidden="true" />}
              {isUp === false && <TrendingDown className="size-3 text-red-500" aria-hidden="true" />}
              <span
                className={cn(
                  "text-xs font-medium",
                  isUp === true
                    ? "text-green-600"
                    : isUp === false
                      ? "text-red-500"
                      : "text-muted-foreground",
                )}
              >
                {deltaText}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              styles.icon,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
