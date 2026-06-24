import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotListPanelSkeleton } from "./SlotListPanelSkeleton";

export function BookingBookerSkeleton() {
  return (
    <div className="w-full max-w-5xl px-0 md:px-4">
      <Card className="overflow-hidden rounded-none border-x-0 bg-card md:rounded-xl md:border-x lg:overflow-visible lg:rounded-xl lg:border lg:border-border lg:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:lg:shadow-none dark:lg:ring-1 dark:lg:ring-white/10">
        <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:divide-x lg:divide-border xl:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="border-b border-border px-4 py-6 lg:px-4 lg:pb-6 lg:pt-6 xl:px-5">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="my-5 h-px w-full" />
            <Skeleton className="h-5 w-40" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>

          <div className="min-w-0 px-4 py-4 md:px-6 lg:px-8 lg:py-6">
            <Skeleton className="mb-4 h-4 w-24 lg:hidden" />
            <Skeleton className="mb-4 h-4 w-32 hidden lg:block" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`dow-${i}`} className="mx-auto h-3 w-6" />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={`day-${i}`} className="aspect-square rounded-lg" />
              ))}
            </div>
            <div className="mt-6">
              <SlotListPanelSkeleton rows={6} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
