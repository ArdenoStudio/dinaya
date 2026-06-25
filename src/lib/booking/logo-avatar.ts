/** SVG marks and similar assets often ship with a large white canvas. */
export function bookingLogoHasIntrinsicPadding(logoUrl: string): boolean {
  const lower = logoUrl.toLowerCase();
  return /\.svg($|[?#])/i.test(lower) || lower.includes("dinaya-logo");
}

/** Zoom raster marks on the large hub avatar so the wordmark fills the circle. */
export const BOOKING_LOGO_RASTER_SCALE = 1.32;
/** Extra zoom for SVG / padded canvas assets. */
export const BOOKING_LOGO_PADDED_SCALE = 1.85;

export function bookingLogoImageScale(logoUrl: string): number {
  return bookingLogoHasIntrinsicPadding(logoUrl)
    ? BOOKING_LOGO_PADDED_SCALE
    : BOOKING_LOGO_RASTER_SCALE;
}
