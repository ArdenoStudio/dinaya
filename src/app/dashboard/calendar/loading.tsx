import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { dashboardSurfaceClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-9 w-10 rounded-md" />
            <Skeleton className="h-9 w-14 rounded-md" />
            <Skeleton className="h-9 w-10 rounded-md" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <DashboardLoadingPanel className="lg:hidden" rows={6} />

      <div className={cn(dashboardSurfaceClass, "hidden flex-1 overflow-hidden lg:block")}>
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
          <div className="border-r" />
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="flex flex-col items-center border-r px-2 py-3 last:border-0"
            >
              <Skeleton className="mb-2 h-3 w-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          <div className="border-r">
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                style={{ height: 56 }}
                className="flex items-start justify-end border-b pr-2 pt-1"
              >
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>

          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="relative border-r last:border-0"
              style={{ height: 14 * 56 }}
            >
              {Array.from({ length: 14 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-b border-muted/40"
                  style={{ top: i * 56 }}
                />
              ))}
              {day % 2 === 0 ? (
                <Skeleton
                  className="absolute left-1 right-1 rounded"
                  style={{ top: `${15 + day * 5}%`, height: 48 }}
                />
              ) : null}
              {day % 3 === 0 ? (
                <Skeleton
                  className="absolute left-1 right-1 rounded"
                  style={{ top: `${40 + day * 3}%`, height: 36 }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
