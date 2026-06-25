import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardLoadingPanel({
  className,
  rows = 5,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("space-y-3", className)}
      role="status"
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="size-4 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

export function DashboardTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-lg border bg-card dark:border-neutral-800 dark:bg-neutral-900"
      role="status"
    >
      <span className="sr-only">Loading</span>
      <div className="border-b bg-muted/40 px-4 py-3">
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="hidden h-4 w-1/6 sm:block" />
            <Skeleton className="ml-auto h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border bg-card dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Skeleton className="h-1 w-full" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
