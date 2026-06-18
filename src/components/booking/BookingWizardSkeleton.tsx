import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingWizardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-none border-x-0 md:rounded-2xl md:border-x">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="mt-4 h-6 w-full" />
      </div>
      <CardContent className="space-y-4 p-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}
