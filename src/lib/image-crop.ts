export type CropTransform = {
  /** Zoom multiplier applied to the source image inside the crop frame. */
  scale: number;
  /** Horizontal offset in pixels from centered position. */
  offsetX: number;
  /** Vertical offset in pixels from centered position. */
  offsetY: number;
};

export type CropFrame = {
  width: number;
  height: number;
};

export type CroppedImageResult = {
  blob: Blob;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

/** Compute the source rectangle to sample for a zoomed, panned crop frame. */
export function computeCropSourceRect(
  image: { width: number; height: number },
  frame: CropFrame,
  transform: CropTransform,
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(0.01, transform.scale);
  const baseScale = Math.max(frame.width / image.width, frame.height / image.height);
  const drawWidth = image.width * baseScale * scale;
  const drawHeight = image.height * baseScale * scale;
  const imgLeft = (frame.width - drawWidth) / 2 + transform.offsetX;
  const imgTop = (frame.height - drawHeight) / 2 + transform.offsetY;

  const visLeft = Math.max(0, imgLeft);
  const visTop = Math.max(0, imgTop);
  const visRight = Math.min(frame.width, imgLeft + drawWidth);
  const visBottom = Math.min(frame.height, imgTop + drawHeight);

  const sx = ((visLeft - imgLeft) / drawWidth) * image.width;
  const sy = ((visTop - imgTop) / drawHeight) * image.height;
  const sw = Math.max(0, ((visRight - visLeft) / drawWidth) * image.width);
  const sh = Math.max(0, ((visBottom - visTop) / drawHeight) * image.height);

  return { sx, sy, sw, sh };
}

export async function cropImageWithTransform(
  imageSrc: string,
  frame: CropFrame,
  transform: CropTransform,
  options?: { mimeType?: string; quality?: number; outputWidth?: number; shape?: "circle" | "rectangle" },
): Promise<CroppedImageResult> {
  const image = await loadImage(imageSrc);
  const outputWidth = options?.outputWidth ?? frame.width;
  const outputHeight = Math.round((outputWidth / frame.width) * frame.height);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  const shape = options?.shape ?? "rectangle";
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  const scale = Math.max(0.01, transform.scale);
  const baseScale = Math.max(frame.width / image.width, frame.height / image.height);
  const drawWidth = image.width * baseScale * scale;
  const drawHeight = image.height * baseScale * scale;
  const imgLeft = (frame.width - drawWidth) / 2 + transform.offsetX;
  const imgTop = (frame.height - drawHeight) / 2 + transform.offsetY;

  // Visible portion of the image within the frame bounds
  const visLeft = Math.max(0, imgLeft);
  const visTop = Math.max(0, imgTop);
  const visRight = Math.min(frame.width, imgLeft + drawWidth);
  const visBottom = Math.min(frame.height, imgTop + drawHeight);

  if (visRight > visLeft && visBottom > visTop) {
    const sx = ((visLeft - imgLeft) / drawWidth) * image.width;
    const sy = ((visTop - imgTop) / drawHeight) * image.height;
    const sw = ((visRight - visLeft) / drawWidth) * image.width;
    const sh = ((visBottom - visTop) / drawHeight) * image.height;

    // Map visible frame region to output canvas — preserves position when image
    // is smaller than the frame (zoomed out below cover).
    const frameToOutput = outputWidth / frame.width;
    const dstX = visLeft * frameToOutput;
    const dstY = visTop * frameToOutput;
    const dstW = (visRight - visLeft) * frameToOutput;
    const dstH = (visBottom - visTop) * frameToOutput;

    ctx.drawImage(image, sx, sy, sw, sh, dstX, dstY, dstW, dstH);
  }

  const mimeType = options?.mimeType ?? "image/webp";
  const quality = options?.quality ?? 0.9;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not export image."))),
      mimeType,
      quality,
    );
  });

  return { blob, width: outputWidth, height: outputHeight };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file."));
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
