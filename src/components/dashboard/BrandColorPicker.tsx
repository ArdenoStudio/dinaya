"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DashboardInput } from "@/components/dashboard/DashboardField";
import { dashboardInputClass } from "@/lib/dashboard-ui";
import { normalizeAccentColor } from "@/lib/booking-theme";
import { isLightHex } from "@/lib/color/luminance";
import type { AccentColorOption } from "@/lib/color/harmonious-palette";

type Props = {
  options: AccentColorOption[];
  value: string;
  onChange: (hex: string) => void;
  loading?: boolean;
  contrastHintId?: string;
};

export function BrandColorPicker({ options, value, onChange, loading, contrastHintId }: Props) {
  const groupId = useId();
  const customPickerId = useId();
  const selected = normalizeAccentColor(value);
  const hasLogoSuggestions = loading || options.length > 0;

  return (
    <div>
      <p id={groupId} className="text-xs font-medium text-muted-foreground">
        {hasLogoSuggestions ? "Suggested from your logo" : "Brand palette"}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={groupId}
        aria-describedby={contrastHintId}
        className="mt-2 flex flex-wrap items-center gap-2"
      >
        {loading ? (
          <div className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
            <Icon name="arrow-repeat" className="animate-spin text-sm" aria-hidden="true" />
            Picking colors from your logo…
          </div>
        ) : options.length > 0 ? (
          options.map((option) => {
            const isSelected = selected === option.hex;
            const light = isLightHex(option.hex);
            return (
              <button
                key={option.hex}
                type="button"
                role="radio"
                aria-checked={isSelected}
                title={`${option.label} (${option.hex})`}
                aria-label={`${option.label}: ${option.hex}`}
                onClick={() => onChange(option.hex)}
                className={`relative size-11 rounded-full border-2 transition-transform active:scale-[0.96] after:absolute after:-inset-1 after:content-[''] ${
                  isSelected
                    ? "border-foreground ring-2 ring-foreground/20"
                    : "border-transparent ring-1 ring-border"
                }`}
                style={{ backgroundColor: option.hex }}
              >
                {isSelected ? (
                  <Icon
                    name="check-lg"
                    className={`absolute inset-0 m-auto text-sm drop-shadow-sm ${
                      light ? "text-foreground" : "text-white"
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">
            Upload a logo above to see color suggestions, or pick a custom color.
          </p>
        )}

        <Popover>
          <PopoverTrigger
            type="button"
            role="radio"
            aria-checked={!options.some((option) => option.hex === selected)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors active:scale-[0.96] ${
              !options.some((option) => option.hex === selected)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            Custom
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <p className="text-xs font-medium text-foreground">Custom color</p>
            <div className="mt-2 flex items-center gap-2">
              <label
                htmlFor={customPickerId}
                className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border"
                style={{ backgroundColor: selected }}
              >
                <input
                  id={customPickerId}
                  type="color"
                  value={selected}
                  onChange={(e) => onChange(e.target.value)}
                  className="sr-only"
                  aria-label="Pick custom accent color"
                />
              </label>
              <DashboardInput
                value={selected}
                onChange={(e) => onChange(e.target.value)}
                className={`${dashboardInputClass} max-w-[8rem] font-mono`}
                pattern="^#[0-9a-fA-F]{6}$"
                aria-label="Accent color hex value"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
