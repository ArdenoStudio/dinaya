const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** True when a hex color reads as light — use dark checkmarks on swatches. */
export function isLightHex(hex: string): boolean {
  if (!HEX_COLOR.test(hex.trim())) return true;
  const value = hex.trim().slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}
