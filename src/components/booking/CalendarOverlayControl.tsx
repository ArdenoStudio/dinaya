"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BookingCopy } from "@/lib/i18n";
import type { GoogleCalendarOverlay } from "./useGoogleCalendarOverlay";
import { useBookingThemeVars } from "./useBookingThemeVars";

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

function OverlayErrorAlert({
  copy,
  overlay,
}: {
  copy: BookingCopy;
  overlay: GoogleCalendarOverlay;
}) {
  if (!overlay.error) return null;
  return (
    <Alert className="border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
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
  );
}

const dialogOverlayClass =
  "fixed inset-0 z-40 bg-black/40 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";

const dialogContentClass =
  "fixed left-1/2 top-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-white p-5 shadow-xl focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

/**
 * Cal.com-style calendar overlay entry point: an inline switch with an
 * "Overlay my calendar" label. First enable opens a "Continue with Google"
 * dialog; once connected, a settings (gear) dialog manages the connection.
 */
export function CalendarOverlayControl({
  copy,
  overlay,
}: {
  copy: BookingCopy;
  overlay: GoogleCalendarOverlay;
}) {
  const switchId = useId();
  const [continueOpen, setContinueOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const themeVars = useBookingThemeVars(continueOpen || settingsOpen);

  const connected = overlay.connected;

  // Close the continue dialog as soon as the OAuth popup reports success.
  useEffect(() => {
    if (connected) setContinueOpen(false);
  }, [connected]);

  if (!overlay.available) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={overlay.enabled}
          disabled={overlay.loading}
          onCheckedChange={(state) => {
            if (!overlay.connected) {
              setContinueOpen(state);
              return;
            }
            overlay.toggle();
          }}
          aria-label={copy.overlayMyCalendar}
          className="data-checked:booking-bg-accent data-unchecked:bg-muted-foreground/35"
        />
        <Label
          htmlFor={switchId}
          className="cursor-pointer text-sm font-medium leading-none text-foreground"
        >
          {copy.overlayMyCalendar}
        </Label>
        {(overlay.connecting || overlay.loading) && (
          <Icon
            name="arrow-repeat"
            className="text-xs text-muted-foreground motion-safe:animate-spin"
            aria-hidden="true"
          />
        )}
        {overlay.connected && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={copy.calendarSettings}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="gear" className="text-sm" aria-hidden="true" />
          </button>
        )}
      </div>

      {!continueOpen && !settingsOpen && <OverlayErrorAlert copy={copy} overlay={overlay} />}

      {/* First-enable: continue with Google (cal.com OverlayCalendarContinueModal) */}
      <Dialog.Root open={continueOpen} onOpenChange={setContinueOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={dialogOverlayClass} />
          <Dialog.Content
            data-booking-theme=""
            style={themeVars ?? undefined}
            className={dialogContentClass}
          >
            <Dialog.Title className="text-base font-semibold text-foreground">
              {copy.overlayMyCalendar}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.calendarConnectorDescription}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={overlay.connecting}
                onClick={() => overlay.toggle()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg booking-bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {overlay.connecting ? (
                  <>
                    <Icon
                      name="arrow-repeat"
                      className="motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                    {copy.calendarConnecting}
                  </>
                ) : (
                  <>
                    <Icon name="google" aria-hidden="true" />
                    {copy.calendarConnectorContinue}
                  </>
                )}
              </button>
              <OverlayErrorAlert copy={copy} overlay={overlay} />
              <p className="text-center text-[11px] text-muted-foreground">
                {copy.calendarPrivacyHint}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={copy.calendarConnectorCancel}
                className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon name="x-lg" className="text-xs" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Connected: manage the connection (cal.com OverlayCalendarSettingsModal) */}
      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={dialogOverlayClass} />
          <Dialog.Content
            data-booking-theme=""
            style={themeVars ?? undefined}
            className={dialogContentClass}
          >
            <Dialog.Title className="text-base font-semibold text-foreground">
              {copy.calendarSettings}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.calendarOverlayHint}
            </Dialog.Description>
            <div className="mt-4 rounded-xl border border-border px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-xs ring-1 ring-border">
                  <Icon name="google" className="text-base" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Google Calendar</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {copy.calendarPrivacyHint}
                  </p>
                </div>
                <Switch
                  checked={overlay.enabled}
                  disabled={overlay.loading}
                  onCheckedChange={() => overlay.toggle()}
                  aria-label={copy.overlayMyCalendar}
                  className="data-checked:booking-bg-accent data-unchecked:bg-muted-foreground/35"
                />
              </div>
              <OverlayErrorAlert copy={copy} overlay={overlay} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={overlay.disconnect}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {copy.disconnect}
                </button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="min-h-9 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {copy.close}
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
