import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const calSans = localFont({
  src: "../fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dinaya — Online Booking for Sri Lankan Businesses",
  description:
    "Give your business a free booking page. No more WhatsApp back-and-forth. Clients self-book, you focus on your work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${calSans.variable} font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
