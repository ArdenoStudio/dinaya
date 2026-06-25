import { BookingPageSkeleton } from "@/components/booking/BookingPageSkeleton";
import { BookingLoadingShell } from "@/components/booking/BookingLoadingShell";

export default function BookingHubLoading() {
  return (
    <BookingLoadingShell variant="hub">
      <div className="w-full max-w-2xl px-0 md:px-4">
        <BookingPageSkeleton />
      </div>
    </BookingLoadingShell>
  );
}
