import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotListPanelSkeleton } from "./SlotListPanelSkeleton";

export function BookingBookerSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-muted/20 md:justify-center md:py-10">
      <div className="w-full max-w-5xl px-0 md:px-4">
        <Card className="overflow-hidden rounded-none border-x-0 md:rounded-xl md:border-x">
          <div className="grid gap-6 md:grid-cols-[minmax(0,17rem)_1fr] md:items-start md:gap-0 md:divide-x md:divide-border lg:grid-cols-[minmax(0,19rem)_1fr]">
            <div className="border-b border-border px-4 py-6 md:px-6 md:pb-6 md:pt-6 lg:px-8">
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

            <div className="min-w-0 px-4 py-4 md:px-0 md:py-6">
              <div className="grid min-h-[22rem] md:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] md:divide-x md:divide-border lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
                <section className="min-w-0 pb-4 md:px-6 md:pb-0 lg:px-8">
                  <Skeleton className="mb-4 h-4 w-24" />
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
                </section>

                <section className="min-w-0 pt-4 md:px-4 md:pt-0 lg:px-5">
                  <div className="mb-4 flex items-baseline justify-between gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="hidden h-3 w-24 md:block" />
                  </div>
                  <SlotListPanelSkeleton rows={5} />
                </section>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
