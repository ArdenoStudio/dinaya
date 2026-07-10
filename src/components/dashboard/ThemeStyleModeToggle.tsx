"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

type Props = {
  solid: boolean;
  disabled?: boolean;
  onChange: (solid: boolean) => void;
};

export function ThemeStyleModeToggle({ solid, disabled, onChange }: Props) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 dark:border-neutral-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Label className="text-sm font-medium">Page style</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {solid
              ? "Brand color fills the page and booking panels."
              : "White surfaces with your brand color on buttons and slots."}
          </p>
        </div>
        <ToggleGroup
          value={solid ? ["solid"] : ["accent"]}
          onValueChange={(values) => {
            const next = values[values.length - 1];
            if (next === "solid" || next === "accent") onChange(next === "solid");
          }}
          disabled={disabled}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem value="accent" className="min-h-11 flex-1 px-4 sm:flex-none">
            Accent
          </ToggleGroupItem>
          <ToggleGroupItem value="solid" className="min-h-11 flex-1 px-4 sm:flex-none">
            Solid
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
