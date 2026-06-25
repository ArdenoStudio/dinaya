import { BookingBookerSkeleton } from "@/components/booking/BookingBookerSkeleton";
import { BookingLoadingShell } from "@/components/booking/BookingLoadingShell";

export default function BookingServiceLoading() {
  return (
    <BookingLoadingShell variant="booker">
      <BookingBookerSkeleton />
    </BookingLoadingShell>
  );
}
