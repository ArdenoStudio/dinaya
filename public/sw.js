self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/") ||
      url.pathname === "/favicon.ico" ||
      url.pathname.endsWith(".woff2"))
  ) {
    return;
  }
  // Let the browser handle page navigations natively — SW passthrough causes
  // "Failed to fetch" network errors on navigate-mode requests in some envs.
  if (event.request.mode === "navigate") return;
  // API routes must not be wrapped — passthrough failures break availability fetches.
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});
