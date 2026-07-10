import { isBusinessImageStorageUrl } from "@/lib/supabase-storage";

type BusinessImages = {
  logoUrl?: string | null;
  galleryImages?: string[] | null;
};

/** URLs removed from settings that point at our Supabase business-logos bucket. */
export function collectRemovedBusinessImageUrls(
  previous: BusinessImages,
  next: BusinessImages,
  supabaseProjectUrl?: string,
): string[] {
  const removed: string[] = [];
  const baseUrl = supabaseProjectUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const prevLogo = previous.logoUrl?.trim() || null;
  const nextLogo = next.logoUrl?.trim() || null;
  if (prevLogo && prevLogo !== nextLogo && baseUrl && isBusinessImageStorageUrl(prevLogo, baseUrl)) {
    removed.push(prevLogo);
  }

  const prevGallery = previous.galleryImages ?? [];
  const nextGallery = next.galleryImages ?? [];
  for (const url of prevGallery) {
    const trimmed = url.trim();
    if (!trimmed || nextGallery.includes(trimmed)) continue;
    if (baseUrl && isBusinessImageStorageUrl(trimmed, baseUrl)) {
      removed.push(trimmed);
    }
  }

  return removed;
}
