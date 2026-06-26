const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const GIF_MAGIC = [0x47, 0x49, 0x46];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

function startsWithBytes(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function detectImageMimeType(buffer: Buffer): string | null {
  if (startsWithBytes(buffer, JPEG_MAGIC)) return "image/jpeg";
  if (startsWithBytes(buffer, PNG_MAGIC)) return "image/png";
  if (startsWithBytes(buffer, GIF_MAGIC)) return "image/gif";
  if (
    startsWithBytes(buffer, WEBP_RIFF) &&
    buffer.length >= 12 &&
    startsWithBytes(buffer.subarray(8, 12), WEBP_MARKER)
  ) {
    return "image/webp";
  }
  return null;
}

export function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
