import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-9 w-10 rounded-md" />
            <Skeleton className="h-9 w-14 rounded-md" />
            <Skeleton className="h-9 w-10 rounded-md" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden flex-1">
        {/* Day Headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
          <div className="border-r" />
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="border-r last:border-0 px-2 py-3 flex flex-col items-center"
            >
              <Skeleton className="h-3 w-8 mb-2" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          {/* Hour Labels */}
          <div className="border-r">
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                style={{ height: 56 }}
                className="border-b flex items-start justify-end pr-2 pt-1"
              >
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>

          {/* Day Columns with Skeleton Events */}
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="border-r last:border-0 relative"
              style={{ height: 14 * 56 }}
            >
              {Array.from({ length: 14 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-b border-muted/40"
                  style={{ top: i * 56 }}
                />
              ))}
              {/* Random skeleton events */}
              {day % 2 === 0 && (
                <Skeleton
                  className="absolute left-1 right-1 rounded"
                  style={{ top: `${15 + day * 5}%`, height: 48 }}
                />
              )}
              {day % 3 === 0 && (
                <Skeleton
                  className="absolute left-1 right-1 rounded"
                  style={{ top: `${40 + day * 3}%`, height: 36 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
