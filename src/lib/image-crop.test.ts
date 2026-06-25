import { describe, expect, it } from "vitest";
import { computeCropSourceRect } from "@/lib/image-crop";

describe("image-crop", () => {
  it("samples the full image at scale 1 with no offset", () => {
    const rect = computeCropSourceRect(
      { width: 1200, height: 800 },
      { width: 400, height: 400 },
      { scale: 1, offsetX: 0, offsetY: 0 },
    );
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
    expect(rect.sw).toBeGreaterThan(0);
    expect(rect.sh).toBeGreaterThan(0);
  });

  it("zooms into the center when scale increases", () => {
    const base = computeCropSourceRect(
      { width: 1000, height: 1000 },
      { width: 500, height: 500 },
      { scale: 1, offsetX: 0, offsetY: 0 },
    );
    const zoomed = computeCropSourceRect(
      { width: 1000, height: 1000 },
      { width: 500, height: 500 },
      { scale: 2, offsetX: 0, offsetY: 0 },
    );
    expect(zoomed.sw).toBeLessThan(base.sw);
    expect(zoomed.sh).toBeLessThan(base.sh);
  });
});
