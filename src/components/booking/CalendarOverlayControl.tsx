"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BookingCopy } from "@/lib/i18n";
import type { GoogleCalendarOverlay } from "./useGoogleCalendarOverlay";

function overlayErrorMessage(
  copy: BookingCopy,
  error: NonNullable<GoogleCalendarOverlay["error"]>,
): string {
  switch (error) {
    case "popup_blocked":
      return copy.calendarPopupBlocked;
    case "popup_closed":
      return copy.calendarPopupClosed;
    case "permission_denied":
      return copy.calendarPermissionDenied;
    case "token_expired":
      return copy.calendarTokenExpired;
    default:
      return copy.calendarOverlayError;
  }
}

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
      className={`rounded-xl border border-border bg-muted/50 ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border">
          <Icon name="calendar2-check" className="text-base" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Label
            htmlFor={switchId}
            className="block text-xs font-semibold text-foreground"
          >
            {copy.overlayMyCalendar}
          </Label>
          <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
            {status}
          </span>
        </div>
        <Switch
          id={switchId}
          checked={overlay.enabled}
          disabled={overlay.connecting || overlay.loading}
          onCheckedChange={() => overlay.toggle()}
          aria-label={copy.overlayMyCalendar}
          className="h-6 w-11 shrink-0 data-[size=default]:h-6 data-[size=default]:w-11 data-checked:booking-bg-accent data-unchecked:bg-muted"
        />
      </div>

      {overlay.error && (
        <Alert className="mt-2.5 border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertDescription className="flex items-center justify-between gap-3 text-[11px] text-inherit">
            <span>{overlayErrorMessage(copy, overlay.error)}</span>
            <AlertAction className="static shrink-0">
              <button
                type="button"
                onClick={overlay.retry}
                className="font-semibold booking-text-accent hover:underline"
              >
                {copy.tryAgain}
              </button>
            </AlertAction>
          </AlertDescription>
        </Alert>
      )}

      {overlay.connected && !overlay.error && !compact && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5 text-[10px] text-muted-foreground">
          <span>{copy.calendarPrivacyHint}</span>
          <button
            type="button"
            onClick={overlay.disconnect}
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            {copy.disconnect}
          </button>
        </div>
      )}
    </div>
  );
}
