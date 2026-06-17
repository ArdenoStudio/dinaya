import type { Metadata } from "next";

export const metadata: Metadata = {
  // Match booking page surfaces so iOS Safari status bar / overscroll areas
  // don't show the old indigo brand color (#6366f1).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  appleWebApp: {
    capable: true,
    title: "Dinaya Booking",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
