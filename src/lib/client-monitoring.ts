"use client";

export function captureClientException(
  error: Error & { digest?: string },
  component: string,
): void {
  const payload = JSON.stringify({
    component,
    digest: error.digest,
    message: error.message,
    stack: error.stack?.slice(0, 4000),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/client-error", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/monitoring/client-error", {
    body: payload,
    headers: { "Content-Type": "application/json" },
    method: "POST",
    keepalive: true,
  });
}
