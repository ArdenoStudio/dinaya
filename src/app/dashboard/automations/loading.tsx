import { Skeleton } from "@/components/ui/skeleton";

export default function AutomationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Automations List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
