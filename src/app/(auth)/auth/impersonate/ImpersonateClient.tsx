"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ImpersonateClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      router.replace("/auth/signin");
      return;
    }
    void signIn("credentials", {
      impersonationToken: token,
      redirect: true,
      callbackUrl: "/dashboard",
    });
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Starting read-only impersonation session…
    </div>
  );
}
