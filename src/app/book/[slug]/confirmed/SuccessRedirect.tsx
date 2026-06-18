"use client";

import { useEffect, useMemo, useState } from "react";
import type { BookingCopy } from "@/lib/i18n";
import {
  buildSuccessRedirectUrl,
  type SuccessRedirectContext,
} from "@/lib/booking/success-redirect";

interface Props {
  redirectUrl: string;
  context: SuccessRedirectContext;
  copy: Pick<BookingCopy, "redirectingConfirmation" | "redirectFallback">;
}

export default function SuccessRedirect({ redirectUrl, context, copy }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(3);
  const targetUrl = useMemo(
    () => buildSuccessRedirectUrl(redirectUrl, context),
    [redirectUrl, context],
  );

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.assign(targetUrl);
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, targetUrl]);

  return (
    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100">
      <p className="font-medium">{copy.redirectingConfirmation}</p>
      <p className="mt-1 text-xs text-blue-800/80 dark:text-blue-200/80">
        {secondsLeft > 0 ? `${secondsLeft}s` : "…"}
      </p>
      <a
        href={targetUrl}
        className="mt-2 inline-block text-xs font-semibold text-blue-700 underline hover:text-blue-900 dark:text-blue-300"
      >
        {copy.redirectFallback}
      </a>
    </div>
  );
}
