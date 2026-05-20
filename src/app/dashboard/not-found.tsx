import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <i className="bi bi-folder-x text-2xl text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <h2 className="mb-2 font-cal text-xl tracking-tight">
          Page not found
        </h2>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          This dashboard page doesn&apos;t exist or you may not have access to it.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/bookings"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
