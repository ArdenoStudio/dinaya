"use client";

import { Icon } from "@/components/ui/Icon";
import { normalizeAccentColor } from "@/lib/booking-theme";
import type { AccentColorOption } from "@/lib/color/harmonious-palette";

type Props = {
  options: AccentColorOption[];
  value: string;
  onSelect: (hex: string) => void;
  loading?: boolean;
};

export function AccentColorSwatches({ options, value, onSelect, loading }: Props) {
  const selected = normalizeAccentColor(value);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="arrow-repeat" className="animate-spin text-sm" aria-hidden="true" />
        Picking colors from your logo…
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-muted-foreground">Suggested from your logo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.hex;
          return (
            <button
              key={option.hex}
              type="button"
              title={`${option.label} (${option.hex})`}
              aria-label={`${option.label}: ${option.hex}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.hex)}
              className={`relative size-10 rounded-full border-2 transition-transform active:scale-[0.96] ${
                isSelected
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-transparent ring-1 ring-border"
              }`}
              style={{ backgroundColor: option.hex }}
            >
              {isSelected ? (
                <Icon
                  name="check-lg"
                  className="absolute inset-0 m-auto text-sm text-white drop-shadow-sm"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
