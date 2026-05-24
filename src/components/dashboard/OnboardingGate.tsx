"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingGate({
  completed,
  children,
}: {
  completed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onSetup = pathname.startsWith("/dashboard/setup");

  useEffect(() => {
    if (!completed && !onSetup) {
      router.replace("/dashboard/setup");
    } else if (completed && onSetup) {
      router.replace("/dashboard");
    }
  }, [completed, onSetup, router]);

  return <>{children}</>;
}
