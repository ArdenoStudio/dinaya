import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Get in Touch | Dinaya",
  description:
    "Questions, feedback, or partnership ideas? Reach out to the Dinaya team. We read every message and reply personally.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
