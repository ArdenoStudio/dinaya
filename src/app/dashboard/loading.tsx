import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatSkeleton } from "@/components/dashboard/DashboardLoadingPanel";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading</span>
      <div>
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <DashboardStatSkeleton count={4} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border px-4 py-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/15 bg-primary/4 p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="mb-3 h-10 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <Skeleton className="mb-1 h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
