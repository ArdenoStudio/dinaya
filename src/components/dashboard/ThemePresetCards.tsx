"use client";

import {
  BOOKING_THEME_PRESETS,
  resolvePageBackgroundColor,
  resolvePanelBackgroundColor,
  type BookingThemePreset,
  type ResolvedBookingTheme,
} from "@/lib/booking-theme";
import { dashboardFilterPillClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const PRESET_LABELS: Record<Exclude<BookingThemePreset, "custom">, string> = {
  classic: "Classic",
  salon: "Salon soft",
  salon_vivid: "Salon vivid",
  spa: "Spa calm",
  bold: "Bold",
};

type Props = {
  activePreset: BookingThemePreset | null;
  customAccent: string;
  disabled?: boolean;
  onSelect: (preset: Exclude<BookingThemePreset, "custom">) => void;
};

function PresetPreviewStrip({ preset }: { preset: Exclude<BookingThemePreset, "custom"> }) {
  const values = BOOKING_THEME_PRESETS[preset];
  const theme: ResolvedBookingTheme = {
    accentColor: values.accentColor,
    pageBackground: values.pageBackground,
    pageBackgroundColor: values.pageBackgroundColor,
    panelBackground: values.panelBackground,
    heroOverlay: values.heroOverlay,
    heroOverlayOpacity: values.heroOverlayOpacity,
    themePreset: preset,
  };
  const pageBg = resolvePageBackgroundColor(theme);
  const panelBg = resolvePanelBackgroundColor(theme);

  return (
    <div className="flex h-8 overflow-hidden rounded-md border border-border/80">
      <span className="w-3 shrink-0" style={{ backgroundColor: values.accentColor }} aria-hidden />
      <span className="flex-1" style={{ backgroundColor: pageBg }} aria-hidden />
      <span className="w-5 shrink-0" style={{ backgroundColor: panelBg }} aria-hidden />
    </div>
  );
}

export function ThemePresetCards({ activePreset, customAccent, disabled, onSelect }: Props) {
  const presets = Object.keys(PRESET_LABELS) as Array<Exclude<BookingThemePreset, "custom">>;

  return (
    <div
      role="radiogroup"
      aria-label="Theme presets"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {presets.map((preset) => {
        const selected = activePreset === preset;
        return (
          <button
            key={preset}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(preset)}
            className={cn(
              "rounded-xl border p-3 text-left transition-[box-shadow,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                : "border-border bg-background hover:border-primary/30",
            )}
          >
            <PresetPreviewStrip preset={preset} />
            <span className="mt-2 block text-sm font-medium">{PRESET_LABELS[preset]}</span>
          </button>
        );
      })}
      {activePreset === "custom" || activePreset === null ? (
        <div
          className={cn(
            dashboardFilterPillClass(true),
            "col-span-full justify-center text-center text-xs",
          )}
        >
          Custom theme based on {customAccent}
        </div>
      ) : null}
    </div>
  );
}
