import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardLoadingPanel,
  DashboardTableSkeleton,
} from "@/components/dashboard/DashboardLoadingPanel";

export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-24 rounded-full" />
        ))}
      </div>

      <DashboardLoadingPanel className="md:hidden" rows={4} />
      <div className="hidden md:block">
        <DashboardTableSkeleton />
      </div>
    </div>
  );
}
