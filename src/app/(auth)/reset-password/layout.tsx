import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — Dinaya",
  description: "Set a new password for your Dinaya account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
