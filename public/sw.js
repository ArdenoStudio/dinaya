self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Let the browser handle all same-origin requests natively.
  // Intercepting Next.js RSC/prefetch fetches causes "network error response"
  // warnings and can break page transitions after form saves.
  if (url.origin === self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});
