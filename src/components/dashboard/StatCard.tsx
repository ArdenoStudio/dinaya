import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardCardClass } from "@/lib/dashboard-ui";

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

/**
 * Typography-led metric — no rainbow accent bars.
 * Cobalt is the only interactive brand hue; deltas use emerald/red semantics.
 */
export function StatCard({
  delta,
  icon: Icon,
  label,
  tone: _tone = "cobalt",
  value,
  className,
  compact = false,
}: {
  delta?: React.ReactNode;
  icon?: LucideIcon;
  label: string;
  /** Kept for API compat; intentionally unused (no decorative tones). */
  tone?: "amber" | "cobalt" | "emerald" | "slate" | "violet";
  value: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  void _tone;
  const { isUp, text: deltaText } = parseDelta(delta);

  return (
    <div
      className={cn(
        dashboardCardClass,
        compact ? "px-4 py-3" : "px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-semibold tracking-tight tabular-nums text-foreground",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            {value}
          </p>
          {delta ? (
            <div className="mt-1.5 flex items-center gap-1">
              {isUp === true ? (
                <TrendingUp className="size-3 text-emerald-600" aria-hidden="true" />
              ) : null}
              {isUp === false ? (
                <TrendingDown className="size-3 text-red-500" aria-hidden="true" />
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isUp === true
                    ? "text-emerald-600"
                    : isUp === false
                      ? "text-red-500"
                      : "text-muted-foreground",
                )}
              >
                {deltaText}
              </span>
            </div>
          ) : null}
        </div>
        {Icon && !compact ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
