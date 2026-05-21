import type { Metadata } from "next";
import { BookingPwa } from "@/components/booking/BookingPwa";

export const metadata: Metadata = {
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    title: "Dinaya Booking",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BookingPwa />
      {children}
    </>
  );
}
