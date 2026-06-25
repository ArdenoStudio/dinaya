/** SVG marks and similar assets often ship with a large white canvas. */
export function bookingLogoHasIntrinsicPadding(logoUrl: string): boolean {
  const lower = logoUrl.toLowerCase();
  return /\.svg($|[?#])/i.test(lower) || lower.includes("dinaya-logo");
}
