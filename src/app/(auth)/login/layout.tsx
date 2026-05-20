import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Dinaya",
  description:
    "Sign in to your Dinaya dashboard to manage bookings, clients, and services.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
