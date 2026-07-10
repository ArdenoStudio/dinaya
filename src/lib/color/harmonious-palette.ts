import { converter, formatHex, parse } from "culori";

const toOklch = converter("oklch");

const HEX_COLOR = /^#[0-9a-f]{6}$/;

export type AccentColorOption = {
  hex: string;
  label: string;
};

/** Build a short monochromatic scale from one brand color. */
export function generateHarmoniousPalette(baseHex: string, count = 3): string[] {
  const normalized = baseHex.trim().toLowerCase();
  if (!HEX_COLOR.test(normalized)) return [normalized];

  const base = toOklch(parse(normalized));
  if (!base || base.l === undefined || base.c === undefined || base.h === undefined) {
    return [normalized];
  }

  const { h, c } = base;
  const baseL = base.l;

  const steps = [
    { l: Math.min(0.92, baseL + 0.22), c: c * 0.35, h },
    { l: Math.min(0.8, baseL + 0.1), c: c * 0.6, h },
    { l: baseL, c, h },
    { l: Math.max(0.34, baseL - 0.14), c: c * 0.9, h },
    { l: baseL, c: c * 0.82, h: (h + 18) % 360 },
  ];

  const palette: string[] = [];
  for (const step of steps) {
    const hex = formatHex({ mode: "oklch", l: step.l, c: step.c, h: step.h });
    if (hex && !palette.includes(hex.toLowerCase())) {
      palette.push(hex.toLowerCase());
    }
    if (palette.length >= count) break;
  }

  return palette.length > 0 ? palette : [normalized];
}

/** Merge extracted logo colors with derived harmonious variants (max 6). */
export function buildAccentColorOptions(logoColors: string[], max = 6): AccentColorOption[] {
  const dominant = logoColors[0];
  const derived = dominant ? generateHarmoniousPalette(dominant, 3) : [];
  const seen = new Set<string>();
  const options: AccentColorOption[] = [];

  for (const hex of logoColors) {
    const normalized = hex.trim().toLowerCase();
    if (!HEX_COLOR.test(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    options.push({
      hex: normalized,
      label: options.length === 0 ? "Main logo color" : "From logo",
    });
    if (options.length >= max) return options;
  }

  for (const hex of derived) {
    const normalized = hex.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    options.push({ hex: normalized, label: "Similar shade" });
    if (options.length >= max) break;
  }

  return options;
}
