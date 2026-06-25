"use client";

import type { Location } from "@/db/schema";
import { Icon } from "@/components/ui/Icon";

interface Props {
  locations: Pick<Location, "id" | "name" | "address">[];
  selected: Pick<Location, "id" | "name" | "address"> | null;
  copy: { branch: string; chooseBranch: string };
  onSelect: (location: Pick<Location, "id" | "name" | "address">) => void;
  compact?: boolean;
}

export default function StepLocation({ locations, selected, copy, onSelect, compact }: Props) {
  if (locations.length <= 1) return null;

  return (
    <div className={compact ? "mt-4 border-t border-border pt-4" : ""}>
      <p className={`font-semibold text-foreground ${compact ? "mb-2 text-sm" : "mb-3 text-base"}`}>
        {copy.chooseBranch}
      </p>
      <div className="space-y-2">
        {locations.map((loc) => {
          const active = selected?.id === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelect(loc)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "booking-border-accent booking-bg-accent-muted/80 ring-1 booking-ring-accent"
                  : "border-border bg-card hover:border-[var(--booking-accent)] hover:booking-bg-accent-muted/30"
              }`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  active ? "booking-border-accent booking-bg-accent text-white" : "border-border"
                }`}
              >
                {active && <Icon name="check" className="text-[10px]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{loc.name}</span>
                {loc.address && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{loc.address}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
