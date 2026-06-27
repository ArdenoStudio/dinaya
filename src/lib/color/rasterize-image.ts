"use client";

const DEFAULT_MAX_SIZE = 160;

/** Downsample a blob or remote URL to an ImageBitmap for palette extraction. */
export async function rasterizeToImageBitmap(
  source: Blob | string,
  options?: { maxSize?: number },
): Promise<ImageBitmap> {
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

  const blob =
    typeof source === "string"
      ? await fetch(source).then(async (res) => {
          if (!res.ok) throw new Error("Could not load image.");
          return res.blob();
        })
      : source;

  const bitmap = await createImageBitmap(blob);
  const longestEdge = Math.max(bitmap.width, bitmap.height);
  if (longestEdge <= maxSize) return bitmap;

  const scale = maxSize / longestEdge;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas is not available.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return createImageBitmap(canvas);
}
