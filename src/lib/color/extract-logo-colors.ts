"use client";

import { buildAccentColorOptions, type AccentColorOption } from "@/lib/color/harmonious-palette";
import { rasterizeToImageBitmap } from "@/lib/color/rasterize-image";

const SWATCH_ROLES = [
  "Vibrant",
  "Muted",
  "DarkVibrant",
  "LightVibrant",
  "LightMuted",
  "DarkMuted",
] as const;

async function extractPaletteHexes(bitmap: ImageBitmap): Promise<string[]> {
  const { getSwatches, getPalette } = await import("colorthief");
  const colors: string[] = [];

  const swatches = await getSwatches(bitmap, {
    colorSpace: "oklch",
    ignoreWhite: true,
    quality: 5,
  });

  for (const role of SWATCH_ROLES) {
    const swatch = swatches[role];
    if (!swatch?.color) continue;
    const hex = swatch.color.hex().toLowerCase();
    if (!colors.includes(hex)) colors.push(hex);
  }

  if (colors.length < 4) {
    const palette = await getPalette(bitmap, {
      colorCount: 6,
      ignoreWhite: true,
      colorSpace: "oklch",
      quality: 5,
    });
    palette?.forEach((color) => {
      const hex = color.hex().toLowerCase();
      if (!colors.includes(hex)) colors.push(hex);
    });
  }

  return colors.slice(0, 6);
}

/** Extract up to six accent suggestions from a logo image. */
export async function extractAccentColorOptions(
  source: Blob | string,
): Promise<AccentColorOption[]> {
  const bitmap = await rasterizeToImageBitmap(source, { maxSize: 160 });
  try {
    const logoColors = await extractPaletteHexes(bitmap);
    return buildAccentColorOptions(logoColors);
  } finally {
    bitmap.close();
  }
}
