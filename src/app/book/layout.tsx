import type { Metadata } from "next";

export const metadata: Metadata = {
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    title: "Dinaya Booking",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
