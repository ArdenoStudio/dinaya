"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGoogleCalendarBusyTimes,
  type CalendarBusyTime,
} from "@/lib/google-calendar-overlay";

export type CalendarOverlayConfig = {
  connectUrl: string;
  channel: string;
};

export type CalendarOverlayError =
  | "popup_blocked"
  | "popup_closed"
  | "permission_denied"
  | "token_expired"
  | "calendar_unavailable";

type CalendarOverlayMessage =
  | {
      type: "dinaya:google-calendar-overlay";
      channel: string;
      status: "success";
      accessToken: string;
      expiresIn?: number;
    }
  | {
      type: "dinaya:google-calendar-overlay";
      channel: string;
      status: "error";
    };

export type GoogleCalendarOverlay = {
  available: boolean;
  connected: boolean;
  enabled: boolean;
  connecting: boolean;
  loading: boolean;
  error: CalendarOverlayError | null;
  busyTimes: CalendarBusyTime[];
  busyDates: Record<string, number>;
  toggle: () => void;
  retry: () => void;
  disconnect: () => void;
};

export function useGoogleCalendarOverlay(input: {
  config?: CalendarOverlayConfig | null;
  selectedDate: string;
  timezone: string;
}): GoogleCalendarOverlay {
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CalendarOverlayError | null>(null);
  const [busyByDate, setBusyByDate] = useState<Record<string, CalendarBusyTime[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const tokenRef = useRef<{ value: string; expiresAt: number } | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectorOrigin = useMemo(() => {
    if (!input.config) return null;
    try {
      return new URL(input.config.connectUrl).origin;
    } catch {
      return null;
    }
  }, [input.config]);

  const stopPopupPolling = useCallback(() => {
    if (popupPollRef.current) {
      clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!input.config || !connectorOrigin) return;
    setError(null);
    setConnecting(true);

    const width = 520;
    const height = 680;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      input.config.connectUrl,
      "dinaya-google-calendar-overlay",
      `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
    );

    if (!popup) {
      setConnecting(false);
      setError("popup_blocked");
      return;
    }

    popupRef.current = popup;
    stopPopupPolling();
    popupPollRef.current = setInterval(() => {
      if (!popup.closed) return;
      stopPopupPolling();
      popupRef.current = null;
      setConnecting((wasConnecting) => {
        if (wasConnecting) setError("popup_closed");
        return false;
      });
    }, 400);
  }, [connectorOrigin, input.config, stopPopupPolling]);

  useEffect(() => {
    if (!input.config || !connectorOrigin) return;

    const handleMessage = (event: MessageEvent<CalendarOverlayMessage>) => {
      if (event.origin !== connectorOrigin) return;
      if (
        event.data?.type !== "dinaya:google-calendar-overlay" ||
        event.data.channel !== input.config?.channel
      ) {
        return;
      }

      stopPopupPolling();
      popupRef.current = null;
      setConnecting(false);

      if (event.data.status === "error") {
        setError("permission_denied");
        return;
      }

      tokenRef.current = {
        value: event.data.accessToken,
        expiresAt: Date.now() + Math.max(60, event.data.expiresIn ?? 3600) * 1000,
      };
      setConnected(true);
      setEnabled(true);
      setError(null);
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [connectorOrigin, input.config, stopPopupPolling]);

  useEffect(() => {
    return () => stopPopupPolling();
  }, [stopPopupPolling]);

  useEffect(() => {
    if (!enabled || !connected || !input.selectedDate) return;
    const token = tokenRef.current;
    if (!token || token.expiresAt <= Date.now()) {
      tokenRef.current = null;
      setConnected(false);
      setEnabled(false);
      setError("token_expired");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetchGoogleCalendarBusyTimes({
      accessToken: token.value,
      date: input.selectedDate,
      timezone: input.timezone,
      signal: controller.signal,
    })
      .then((busyTimes) => {
        setBusyByDate((current) => ({ ...current, [input.selectedDate]: busyTimes }));
      })
      .catch((fetchError: Error & { status?: number }) => {
        if (fetchError.name === "AbortError") return;
        if (fetchError.status === 401 || fetchError.status === 403) {
          tokenRef.current = null;
          setConnected(false);
          setEnabled(false);
          setError("token_expired");
          return;
        }
        setError("calendar_unavailable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    connected,
    enabled,
    input.selectedDate,
    input.timezone,
    refreshKey,
  ]);

  const disconnect = useCallback(() => {
    tokenRef.current = null;
    setConnected(false);
    setEnabled(false);
    setConnecting(false);
    setError(null);
    setBusyByDate({});
    stopPopupPolling();
    popupRef.current?.close();
    popupRef.current = null;
  }, [stopPopupPolling]);

  const toggle = useCallback(() => {
    if (!connected) {
      connect();
      return;
    }
    setEnabled((value) => !value);
    setError(null);
  }, [connect, connected]);

  const retry = useCallback(() => {
    if (!connected) {
      connect();
      return;
    }
    setError(null);
    setEnabled(true);
    setRefreshKey((value) => value + 1);
  }, [connect, connected]);

  const busyDates = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(busyByDate)
          .filter(([, busyTimes]) => busyTimes.length > 0)
          .map(([date, busyTimes]) => [date, busyTimes.length]),
      ),
    [busyByDate],
  );

  return {
    available: Boolean(input.config && connectorOrigin),
    connected,
    enabled,
    connecting,
    loading,
    error,
    busyTimes: enabled ? (busyByDate[input.selectedDate] ?? []) : [],
    busyDates: enabled ? busyDates : {},
    toggle,
    retry,
    disconnect,
  };
}
