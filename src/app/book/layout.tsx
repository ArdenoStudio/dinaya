import type { Metadata, Viewport } from "next";
import { bookingViewport } from "@/lib/viewport-theme";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    title: "Dinaya Booking",
  },
};

export const viewport: Viewport = bookingViewport;

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
