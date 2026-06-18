import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((section) => (
          <div key={section} className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-6">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="space-y-4">
              {[1, 2, 3].map((field) => (
                <div key={field}>
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Skeleton className="h-14 w-full rounded-lg xl:col-span-2" />
      </div>
    </div>
  );
}
