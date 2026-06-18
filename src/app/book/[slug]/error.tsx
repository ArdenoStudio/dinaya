"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isTransientDbConnectionError } from "@/lib/dashboard/db-compat";

export default function BookingError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const connectionIssue = isTransientDbConnectionError(error);

  useEffect(() => {
    console.error("Booking error:", error);
  }, [error]);

  function handleRetry() {
    setIsRetrying(true);
    window.location.reload();
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
            <Icon name="calendar-x" className="text-2xl text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Booking unavailable</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {connectionIssue
            ? "We couldn\u2019t reach the database just now. This is usually temporary \u2014 try again in a moment."
            : "We\u2019re having trouble loading the booking page. This could be a temporary issue."}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? "Retrying\u2026" : "Try again"}
          </button>
          <Link
            href="/"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50"
          >
            Go to Homepage
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
