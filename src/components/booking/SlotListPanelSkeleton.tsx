import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/Icon";

const ROW_WIDTHS = ["w-16", "w-20", "w-14", "w-[4.5rem]", "w-20", "w-[3.75rem]"];

function LoadingLabel({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon name="arrow-repeat" className="size-3.5 shrink-0 motion-safe:animate-spin opacity-70" />
      {label}
    </p>
  );
}

interface SlotListPanelSkeletonProps {
  rows?: number;
  label?: string;
}

export function SlotListPanelSkeleton({
  rows = 6,
  label = "Loading available times",
}: SlotListPanelSkeletonProps) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label={label}>
      <LoadingLabel label={label} />
      <div>
        <Skeleton className="mb-2 h-3 w-14" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-11 animate-pulse items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2"
            >
              <Skeleton className="size-2 shrink-0 rounded-full" />
              <Skeleton className={`h-4 ${ROW_WIDTHS[i % ROW_WIDTHS.length]}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimeSlotGridSkeleton({
  label = "Loading available times",
}: {
  label?: string;
}) {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label={label}>
      <LoadingLabel label={label} />
      <div>
        <Skeleton className="mb-2.5 h-3 w-16" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
