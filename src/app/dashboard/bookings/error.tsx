"use client";

import { useEffect } from "react";

export default function BookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bookings error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-100">
            <i className="bi bi-calendar-x text-xl text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-semibold">
          Failed to load bookings
        </h2>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          There was an error loading your bookings. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
