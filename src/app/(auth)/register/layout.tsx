import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Dinaya",
  description:
    "Create your free Dinaya account and set up your online booking page in minutes. No credit card required.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
