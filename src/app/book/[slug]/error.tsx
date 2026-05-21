"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Booking error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
            <i className="bi bi-calendar-x text-2xl text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold">
          Booking unavailable
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          We&apos;re having trouble loading the booking page. This could be a temporary issue.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50"
          >
            Go to Homepage
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
