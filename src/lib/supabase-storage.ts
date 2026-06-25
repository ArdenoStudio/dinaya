import { createClient } from "@supabase/supabase-js";

export const BUSINESS_LOGOS_BUCKET = "business-logos";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
};

export function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function createBusinessLogosStorage(config: SupabaseStorageConfig) {
  return createClient(config.url, config.serviceRoleKey).storage.from(BUSINESS_LOGOS_BUCKET);
}

export function extensionFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext || !MIME_BY_EXT[ext]) {
    throw new Error(`Unsupported image extension in path: ${path}`);
  }
  return ext === "jpeg" ? "jpeg" : ext;
}

export function contentTypeForExtension(ext: string): string {
  const normalized = ext === "jpg" ? "jpeg" : ext;
  const mime = MIME_BY_EXT[normalized];
  if (!mime) throw new Error(`Unsupported image extension: ${ext}`);
  return mime;
}

export function publicLogoUrl(storage: ReturnType<typeof createBusinessLogosStorage>, path: string): string {
  const { data } = storage.getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
