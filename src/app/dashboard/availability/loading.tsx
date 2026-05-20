import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Staff Selector */}
      <div className="mb-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-64 rounded-md" />
      </div>

      {/* Week Days */}
      <div className="grid gap-4">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
          (day) => (
            <div key={day} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
