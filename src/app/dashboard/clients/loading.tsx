import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardLoadingPanel,
  DashboardStatSkeleton,
} from "@/components/dashboard/DashboardLoadingPanel";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <DashboardStatSkeleton count={4} />

      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-11 min-w-[220px] flex-1 rounded-lg" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-11 w-20 rounded-full" />
          ))}
        </div>
      </div>

      <DashboardLoadingPanel rows={6} />
    </div>
  );
}
