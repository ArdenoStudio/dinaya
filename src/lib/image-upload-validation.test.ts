import { describe, expect, it } from "vitest";
import { detectImageMimeType, extensionForMimeType } from "@/lib/image-upload-validation";

describe("detectImageMimeType", () => {
  it("detects webp from magic bytes", () => {
    const buffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectImageMimeType(buffer)).toBe("image/webp");
    expect(extensionForMimeType("image/webp")).toBe("webp");
  });

  it("rejects unknown bytes", () => {
    expect(detectImageMimeType(Buffer.from([1, 2, 3]))).toBeNull();
  });
});
