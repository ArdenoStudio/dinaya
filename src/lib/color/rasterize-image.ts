"use client";

const DEFAULT_MAX_SIZE = 160;

async function blobToImageBitmap(blob: Blob, maxSize: number): Promise<ImageBitmap> {
  try {
    const bitmap = await createImageBitmap(blob);
    return downscaleBitmap(bitmap, maxSize);
  } catch {
    return rasterizeViaCanvas(blob, maxSize);
  }
}

function downscaleBitmap(bitmap: ImageBitmap, maxSize: number): ImageBitmap | Promise<ImageBitmap> {
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

async function rasterizeViaCanvas(blob: Blob, maxSize: number): Promise<ImageBitmap> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image."));
      img.src = objectUrl;
    });

    const longestEdge = Math.max(image.naturalWidth || maxSize, image.naturalHeight || maxSize, 1);
    const scale = Math.min(1, maxSize / longestEdge);
    const width = Math.max(1, Math.round((image.naturalWidth || maxSize) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || maxSize) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    ctx.drawImage(image, 0, 0, width, height);
    return createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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

  return blobToImageBitmap(blob, maxSize);
}
