import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-white">
            <Skeleton className="h-[3px] w-full" />
            <div className="flex items-start gap-3 p-5">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        {/* Today Timeline */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border px-4 py-3"
              >
                <Skeleton className="w-20 h-5" />
                <Skeleton className="flex-1 h-5" />
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share Link Card */}
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border bg-white p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                  <Skeleton className="h-4 w-40 mb-1" />
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
