"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
            <i className="bi bi-shield-exclamation text-2xl text-red-600" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold">
          Admin panel error
        </h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          An error occurred while loading the admin panel. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50"
          >
            Admin Home
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
