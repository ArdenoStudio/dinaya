"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GOOGLE_CALENDAR_FREE_BUSY_SCOPE } from "@/lib/google-calendar-overlay";
import { getBookingCopy, type BookingLanguage } from "@/lib/i18n";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: () => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export default function CalendarOverlayConnector({
  clientId,
  targetOrigin,
  channel,
  language = "en",
}: {
  clientId: string;
  targetOrigin: string;
  channel: string;
  language?: BookingLanguage;
}) {
  const copy = getBookingCopy(language);
  const [scriptReady, setScriptReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const connectStartedRef = useRef(false);

  const sendError = useCallback(() => {
    window.opener?.postMessage(
      {
        type: "dinaya:google-calendar-overlay",
        channel,
        status: "error",
      },
      targetOrigin,
    );
  }, [channel, targetOrigin]);

  const connect = useCallback(() => {
    if (connectStartedRef.current) return;
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth || !window.opener) {
      setError(true);
      sendError();
      return;
    }

    connectStartedRef.current = true;
    setConnecting(true);
    setError(false);
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_FREE_BUSY_SCOPE,
      callback: (response) => {
        if (!response.access_token || response.error) {
          setConnecting(false);
          setError(true);
          sendError();
          return;
        }

        window.opener?.postMessage(
          {
            type: "dinaya:google-calendar-overlay",
            channel,
            status: "success",
            accessToken: response.access_token,
            expiresIn: response.expires_in,
          },
          targetOrigin,
        );
        setConnecting(false);
        setSuccess(true);
        window.setTimeout(() => window.close(), 700);
      },
      error_callback: () => {
        setConnecting(false);
        setError(true);
        sendError();
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  }, [channel, clientId, sendError, targetOrigin]);

  useEffect(() => {
    if (!scriptReady || success || error) return;
    connect();
  }, [connect, error, scriptReady, success]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f2f2f7] px-5 py-10 dark:bg-neutral-950">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError(true)}
      />
      <Card className="w-full max-w-sm overflow-hidden rounded-3xl border-black/5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.28)] dark:border-white/10">
        <CardHeader className="border-b border-gray-100 px-6 py-5 dark:border-neutral-800">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Dinaya</p>
          <CardTitle className="mt-2 font-cal text-2xl tracking-tight text-gray-950 dark:text-white">
            {copy.calendarConnectorTitle}
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            {copy.calendarConnectorDescription}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3.5 dark:bg-neutral-950/60">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm dark:bg-neutral-900 dark:text-gray-300">
              <Icon name="shield-check" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {copy.calendarConnectorReadOnlyTitle}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                {copy.calendarConnectorReadOnlyDescription}
              </p>
            </div>
          </div>

          {success ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon name="check-circle-fill" aria-hidden="true" />
              {copy.calendarConnectorConnected}
            </div>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={!scriptReady || connecting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              <Icon name="calendar2-check" aria-hidden="true" />
              {connecting
                ? copy.calendarConnectorOpening
                : scriptReady
                  ? copy.calendarConnectorContinue
                  : copy.calendarConnectorLoading}
            </button>
          )}

          {error && !success && (
            <p className="mt-3 text-center text-xs text-amber-700 dark:text-amber-300">
              {copy.calendarConnectorError}
            </p>
          )}

          <button
            type="button"
            onClick={() => window.close()}
            className="mt-4 w-full text-center text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {copy.calendarConnectorCancel}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
