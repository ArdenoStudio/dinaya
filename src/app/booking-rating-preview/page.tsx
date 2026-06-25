import { notFound } from "next/navigation";
import { BookingRatingPreview } from "@/components/booking/BookingRatingPreview";

export default function BookingRatingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <BookingRatingPreview />;
}
