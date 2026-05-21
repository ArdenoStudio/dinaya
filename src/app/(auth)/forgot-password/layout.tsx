import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password — Dinaya",
  description: "Request a password reset link for your Dinaya account.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
