import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { NavProvider } from "@/context/NavContext";
import { SmoothScroll } from "@/components/SmoothScroll";
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
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} ${calSans.variable} font-sans`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to main content
        </a>
        <SmoothScroll />
        <NavProvider>
          <main id="main-content">
            {children}
          </main>
        </NavProvider>
        <Analytics />
      </body>
    </html>
  );
}
