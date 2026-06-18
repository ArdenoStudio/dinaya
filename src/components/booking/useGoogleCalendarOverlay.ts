"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import {
  busyTimesForDate,
  countBusyDates,
  fetchGoogleCalendarBusyMonth,
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

function adjacentMonths(month: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const anchor = parseISO(`${month}-01T12:00:00`);
  return [
    format(addMonths(anchor, -1), "yyyy-MM"),
    month,
    format(addMonths(anchor, 1), "yyyy-MM"),
  ];
}

function monthsToPrefetch(viewMonth: string | undefined, selectedDate: string): string[] {
  const months = new Set<string>();
  for (const month of [viewMonth, selectedDate.slice(0, 7)].filter(Boolean) as string[]) {
    for (const adjacent of adjacentMonths(month)) {
      months.add(adjacent);
    }
  }
  return [...months];
}

export function useGoogleCalendarOverlay(input: {
  config?: CalendarOverlayConfig | null;
  selectedDate: string;
  viewMonth?: string;
  timezone: string;
}): GoogleCalendarOverlay {
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CalendarOverlayError | null>(null);
  const [monthBusyCache, setMonthBusyCache] = useState<Record<string, CalendarBusyTime[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchedMonthsRef = useRef<Record<string, number>>({});
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
      if (event.source !== popupRef.current) return;
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

  const prefetchMonths = useMemo(
    () => monthsToPrefetch(input.viewMonth, input.selectedDate),
    [input.selectedDate, input.viewMonth],
  );

  useEffect(() => {
    if (!enabled || !connected || prefetchMonths.length === 0) return;
    const token = tokenRef.current;
    if (!token || token.expiresAt <= Date.now()) {
      tokenRef.current = null;
      setConnected(false);
      setEnabled(false);
      setError("token_expired");
      return;
    }

    const monthsToFetch = prefetchMonths.filter(
      (month) => fetchedMonthsRef.current[month] !== refreshKey,
    );
    if (monthsToFetch.length === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void Promise.all(
      monthsToFetch.map((month) =>
        fetchGoogleCalendarBusyMonth({
          accessToken: token.value,
          month,
          timezone: input.timezone,
          signal: controller.signal,
        }).then((busyTimes) => [month, busyTimes] as const),
      ),
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        setMonthBusyCache((current) => {
          const next = { ...current };
          for (const [month, busyTimes] of results) {
            next[month] = busyTimes;
            fetchedMonthsRef.current[month] = refreshKey;
          }
          return next;
        });
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
  }, [connected, enabled, input.timezone, prefetchMonths, refreshKey]);

  const disconnect = useCallback(() => {
    tokenRef.current = null;
    setConnected(false);
    setEnabled(false);
    setConnecting(false);
    setError(null);
    setMonthBusyCache({});
    fetchedMonthsRef.current = {};
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

  const cachedBusyTimes = useMemo(() => {
    if (!enabled) return [];
    const merged = new Map<string, CalendarBusyTime>();
    for (const busyTimes of Object.values(monthBusyCache)) {
      for (const busy of busyTimes) {
        merged.set(`${busy.start}|${busy.end}`, busy);
      }
    }
    return [...merged.values()];
  }, [enabled, monthBusyCache]);

  const busyTimes = useMemo(
    () =>
      enabled && input.selectedDate
        ? busyTimesForDate(input.selectedDate, cachedBusyTimes, input.timezone)
        : [],
    [cachedBusyTimes, enabled, input.selectedDate, input.timezone],
  );

  const busyDates = useMemo(
    () => (enabled ? countBusyDates(cachedBusyTimes, input.timezone) : {}),
    [cachedBusyTimes, enabled, input.timezone],
  );

  return {
    available: Boolean(input.config && connectorOrigin),
    connected,
    enabled,
    connecting,
    loading,
    error,
    busyTimes,
    busyDates,
    toggle,
    retry,
    disconnect,
  };
}
