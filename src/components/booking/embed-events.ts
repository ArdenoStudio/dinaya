"use client";

/**
 * Embed postMessage events for host-page integrations.
 *
 * Events (all include `type`):
 * - `dinaya:resize` — `{ height: number }` (existing)
 * - `dinaya:ready` — `{ slug: string }` when booking UI mounts
 * - `dinaya:booking_started` — `{ slug: string, serviceId?: string }` when service selected
 * - `dinaya:booking_completed` — `{ slug: string, status?: string }`
 *
 * Optional theming via query `?embedAccent=%23hex` sets `--booking-accent` on the embed root.
 */

export type EmbedEvent =
  | { type: "dinaya:resize"; height: number }
  | { type: "dinaya:ready"; slug: string }
  | { type: "dinaya:booking_started"; slug: string; serviceId?: string }
  | { type: "dinaya:booking_completed"; slug: string; status?: string };

export function createBookingCompletedEmbedEvent(
  slug: string,
  status?: string,
): EmbedEvent {
  return {
    type: "dinaya:booking_completed",
    slug,
    status,
  };
}

function resolveEmbedParentOrigin(): string | null {
  if (typeof window === "undefined") return null;

  const parentOrigin = new URLSearchParams(window.location.search).get("parentOrigin");
  if (!parentOrigin) return null;

  try {
    const url = new URL(parentOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function postEmbedEvent(event: EmbedEvent) {
  if (typeof window === "undefined" || window.parent === window) return;

  const targetOrigin = resolveEmbedParentOrigin();
  if (!targetOrigin) return;

  window.parent.postMessage(event, targetOrigin);
}

export function applyEmbedThemeFromQuery() {
  if (typeof window === "undefined") return;
  const accent = new URLSearchParams(window.location.search).get("embedAccent");
  if (!accent || !/^#[0-9A-Fa-f]{3,8}$/.test(accent)) return;
  const root = document.querySelector("[data-booking-embed-root]") as HTMLElement | null;
  if (root) root.style.setProperty("--booking-accent", accent);
}
