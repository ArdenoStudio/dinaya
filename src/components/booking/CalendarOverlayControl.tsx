"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BookingCopy } from "@/lib/i18n";
import type { GoogleCalendarOverlay } from "./useGoogleCalendarOverlay";

export function CalendarOverlayControl({
  copy,
  overlay,
  compact = false,
}: {
  copy: BookingCopy;
  overlay: GoogleCalendarOverlay;
  compact?: boolean;
}) {
  const switchId = useId();

  if (!overlay.available) return null;

  const status = overlay.connecting
    ? copy.calendarConnecting
    : overlay.loading
      ? copy.calendarChecking
      : overlay.connected
        ? overlay.enabled
          ? copy.calendarOverlayOn
          : copy.calendarOverlayOff
        : copy.calendarOverlayHint;

  return (
    <div
      className={`rounded-xl border border-gray-100 bg-gray-50/70 dark:border-neutral-800 dark:bg-neutral-950/40 ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 dark:bg-neutral-900 dark:text-gray-300 dark:ring-neutral-800">
          <Icon name="calendar2-check" className="text-base" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Label
            htmlFor={switchId}
            className="block text-xs font-semibold text-gray-800 dark:text-gray-200"
          >
            {copy.overlayMyCalendar}
          </Label>
          <span className="mt-0.5 block text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            {status}
          </span>
        </div>
        <Switch
          id={switchId}
          checked={overlay.enabled}
          disabled={overlay.connecting}
          onCheckedChange={() => overlay.toggle()}
          aria-label={copy.overlayMyCalendar}
          className="h-6 w-11 shrink-0 data-[size=default]:h-6 data-[size=default]:w-11 data-checked:booking-bg-accent data-unchecked:bg-gray-200 dark:data-unchecked:bg-neutral-700"
        />
      </div>

      {overlay.error && (
        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-gray-200/70 pt-2.5 text-[11px] dark:border-neutral-800">
          <span className="text-amber-700 dark:text-amber-300">
            {overlay.error === "popup_blocked"
              ? copy.calendarPopupBlocked
              : overlay.error === "popup_closed"
                ? copy.calendarPopupClosed
                : overlay.error === "permission_denied"
                  ? copy.calendarPermissionDenied
                  : overlay.error === "token_expired"
                    ? copy.calendarTokenExpired
                    : copy.calendarOverlayError}
          </span>
          <button
            type="button"
            onClick={overlay.retry}
            className="shrink-0 font-semibold booking-text-accent hover:underline"
          >
            {copy.tryAgain}
          </button>
        </div>
      )}

      {overlay.connected && !overlay.error && !compact && (
        <div className="mt-2.5 flex items-center justify-between border-t border-gray-200/70 pt-2.5 text-[10px] text-gray-400 dark:border-neutral-800 dark:text-gray-500">
          <span>{copy.calendarPrivacyHint}</span>
          <button
            type="button"
            onClick={overlay.disconnect}
            className="font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {copy.disconnect}
          </button>
        </div>
      )}
    </div>
  );
}
