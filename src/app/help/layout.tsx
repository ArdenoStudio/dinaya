import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center — Guides & FAQ | Dinaya",
  description:
    "Find answers to common questions about setting up your booking page, managing appointments, accepting payments, and more.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
