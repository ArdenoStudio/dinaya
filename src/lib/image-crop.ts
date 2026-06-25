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
  const scale = Math.max(1, transform.scale);
  const baseScale = Math.max(frame.width / image.width, frame.height / image.height);
  const drawWidth = image.width * baseScale * scale;
  const drawHeight = image.height * baseScale * scale;
  const centeredX = (frame.width - drawWidth) / 2 + transform.offsetX;
  const centeredY = (frame.height - drawHeight) / 2 + transform.offsetY;

  const sx = Math.max(0, (-centeredX / drawWidth) * image.width);
  const sy = Math.max(0, (-centeredY / drawHeight) * image.height);
  const sw = Math.min(image.width - sx, (frame.width / drawWidth) * image.width);
  const sh = Math.min(image.height - sy, (frame.height / drawHeight) * image.height);

  return { sx, sy, sw, sh };
}

export async function cropImageWithTransform(
  imageSrc: string,
  frame: CropFrame,
  transform: CropTransform,
  options?: { mimeType?: string; quality?: number; outputWidth?: number },
): Promise<CroppedImageResult> {
  const image = await loadImage(imageSrc);
  const { sx, sy, sw, sh } = computeCropSourceRect(image, frame, transform);
  const outputWidth = options?.outputWidth ?? frame.width;
  const outputHeight = Math.round((outputWidth / frame.width) * frame.height);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

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
