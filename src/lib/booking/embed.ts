import { getAppBaseUrl } from "@/lib/booking-url";

/**
 * Embed integration helpers.
 *
 * Host pages using `public/embed.js` receive postMessage events:
 * - `dinaya:resize` `{ height: number }`
 * - `dinaya:ready` `{ slug: string }`
 * - `dinaya:booking_started` `{ slug: string, serviceId?: string }`
 * - `dinaya:booking_completed` `{ slug: string, status?: string }`
 *
 * Non-resize events are re-dispatched as `dinaya-embed` CustomEvents on `document`.
 * Optional theming: pass `embedAccent` in embed config (e.g. `#2563eb`).
 */

export function buildEmbedIframeSnippet(slug: string, serviceSlug?: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ embed: "1" });
  if (serviceSlug) params.set("service", serviceSlug);
  const src = `${base}/embed/book/${slug}?${params.toString()}`;
  return `<iframe src="${src}" width="100%" height="720" style="border:0;border-radius:16px" title="Book appointment"></iframe>`;
}

export function buildEmbedScriptSnippet(): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return `<script src="${base}/embed.js" data-base="${base}" async></script>
<script>
  DinayaEmbed.inline({
    element: "#dinaya-booking",
    slug: "your-slug",
    height: 720,
    config: { service: "haircut", hideGallery: true }
  });
</script>
<div id="dinaya-booking"></div>`;
}

export function buildEmbedModalSnippet(slug: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return `<script src="${base}/embed.js" data-base="${base}" async></script>
<button type="button" onclick="DinayaEmbed.modal({ slug: '${slug}', config: { hideGallery: true } })">
  Book now
</button>`;
}
