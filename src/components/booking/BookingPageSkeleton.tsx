import { Skeleton } from "@/components/ui/skeleton";

export function BookingPageSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/80 booking-panel-surface shadow-none dark:ring-1 dark:ring-white/10">
      <div className="relative">
        <Skeleton className="aspect-[16/7] w-full rounded-none md:rounded-t-2xl" />
        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
          <Skeleton className="size-20 rounded-full ring-2 ring-card" />
        </div>
      </div>
      <div className="space-y-0 px-4 pb-4 pt-16 md:px-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64 max-w-full" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="mt-3 rounded-xl border border-border/50 px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
