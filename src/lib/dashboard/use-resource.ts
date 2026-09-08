"use client";

import { useEffect, useState } from "react";

/**
 * Fetches `url` on mount and whenever it changes. Kills the repeated
 * useState+useEffect+fetch load boilerplate duplicated across dashboard
 * detail/edit pages (services/[id], staff/[id], etc).
 */
export function useResource<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load. Check your connection and try again.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, setData, loading, error, setError };
}

/**
 * POSTs/PATCHes `body` to `url` and extracts a server-provided error message
 * on failure, matching the `{ error?: string }` shape used across the
 * dashboard API routes.
 */
export async function submitResource(
  url: string,
  body: unknown,
  method: "POST" | "PATCH" = "PATCH",
): Promise<{ ok: true; data: unknown } | { ok: false; error: string; status?: number }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
      return { ok: false, error: message, status: res.status };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Check your connection and try again." };
  }
}
