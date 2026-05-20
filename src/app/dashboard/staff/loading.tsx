import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Staff Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
