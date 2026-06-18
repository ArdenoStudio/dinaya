import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingPageSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-muted/20 md:justify-center md:py-10">
      <div className="w-full max-w-4xl px-0 md:px-4">
        <Card className="rounded-none border-x-0 md:rounded-xl md:border-x">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-t border-border px-5 py-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-full max-w-sm" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
