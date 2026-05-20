import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border rounded-xl p-4 text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/20">
            <tr>
              <th className="px-5 py-3"><Skeleton className="h-3 w-12" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-12" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-16" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-10" /></th>
              <th className="px-5 py-3"><Skeleton className="h-3 w-12" /></th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-4 w-48" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-5 w-9 rounded-full" /></td>
                <td className="px-5 py-3.5"><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
