"use client";

import { useEffect } from "react";

const RECOVERY_KEY = "dinaya:chunk-recovery";
const RECOVERY_WINDOW_MS = 30_000;

function isChunkLoadFailure(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? `${reason.name} ${reason.message}`
      : typeof reason === "string"
        ? reason
        : "";

  return /ChunkLoadError|Loading chunk|failed to fetch dynamically imported module|importing a module script failed/i.test(
    message,
  );
}

function recoverFromChunkFailure() {
  const lastRecoveryAt = Number(sessionStorage.getItem(RECOVERY_KEY) ?? 0);
  if (Date.now() - lastRecoveryAt < RECOVERY_WINDOW_MS) return;
  sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      if (isChunkLoadFailure(event.error) || isChunkLoadFailure(event.message)) {
        recoverFromChunkFailure();
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadFailure(event.reason)) {
        recoverFromChunkFailure();
      }
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    const cleanupTimer = window.setTimeout(() => {
      sessionStorage.removeItem(RECOVERY_KEY);
    }, RECOVERY_WINDOW_MS);

    return () => {
      window.clearTimeout(cleanupTimer);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
