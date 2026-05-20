import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Business Info Section */}
        <div className="rounded-xl border bg-white p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Section */}
        <div className="rounded-xl border bg-white p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
