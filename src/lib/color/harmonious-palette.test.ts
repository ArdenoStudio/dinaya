import { describe, expect, it } from "vitest";
import { buildAccentColorOptions, generateHarmoniousPalette } from "@/lib/color/harmonious-palette";

describe("harmonious-palette", () => {
  it("generates a short palette from a valid hex color", () => {
    const palette = generateHarmoniousPalette("#ff46a2", 4);
    expect(palette.length).toBeGreaterThanOrEqual(3);
    palette.forEach((hex) => expect(hex).toMatch(/^#[0-9a-f]{6}$/));
  });

  it("merges logo colors with derived shades without duplicates", () => {
    const options = buildAccentColorOptions(["#ff46a2", "#ff46a2", "#111111"], 6);
    expect(options.length).toBeGreaterThan(2);
    expect(options[0]?.label).toBe("Main logo color");
    const unique = new Set(options.map((option) => option.hex));
    expect(unique.size).toBe(options.length);
  });
});
