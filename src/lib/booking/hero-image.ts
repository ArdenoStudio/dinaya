/** Skip seeded/dev placeholder paths that are not real uploaded media. */
export function isResolvableBookingImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/demo/")) return false;
  return true;
}

export function resolveHeroImageUrl(
  gallery: string[] | null | undefined,
  options?: { hideGallery?: boolean },
): string | null {
  if (options?.hideGallery) return null;
  const first = gallery?.find((url) => isResolvableBookingImageUrl(url));
  return first ?? null;
}
