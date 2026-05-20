import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's New — Product Updates | Dinaya",
  description:
    "Every update, improvement, and fix — straight from the team building Dinaya for Sri Lankan businesses.",
};

export default function WhatsNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
