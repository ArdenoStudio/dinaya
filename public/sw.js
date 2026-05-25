self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Let the browser handle page navigations natively — SW passthrough causes
  // "Failed to fetch" network errors on navigate-mode requests in some envs.
  if (event.request.mode === "navigate") return;
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});
