import { Skeleton } from "@/components/ui/skeleton";

interface SlotListPanelSkeletonProps {
  rows?: number;
  label?: string;
}

export function SlotListPanelSkeleton({
  rows = 6,
  label = "Loading available times",
}: SlotListPanelSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
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
    <div role="status" aria-busy="true" aria-label={label}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
