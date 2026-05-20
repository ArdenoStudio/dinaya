import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          {/* Share Tools */}
          <div className="rounded-xl border bg-white p-5">
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="h-10 w-full rounded-md mb-3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-md" />
              ))}
            </div>
          </div>

          {/* QR Poster */}
          <div className="rounded-xl border bg-white p-5">
            <Skeleton className="h-5 w-24 mb-3" />
            <Skeleton className="mx-auto size-52 rounded-lg" />
            <Skeleton className="mt-3 mx-auto h-4 w-64" />
          </div>

          {/* Snippets */}
          <div className="rounded-xl border bg-white p-5">
            <Skeleton className="h-5 w-20 mb-3" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-20 w-full rounded-md mb-4" />
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-20 w-full rounded-md mb-4" />
            <Skeleton className="h-4 w-28 mb-1" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-[720px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
