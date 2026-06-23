"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SetupWizardSkeleton } from "@/components/dashboard/SetupWizardSkeleton";

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
      return;
    }
    if (completed && onSetup) {
      router.replace("/dashboard");
    }
  }, [completed, onSetup, router]);

  if (!completed && !onSetup) {
    return <SetupWizardSkeleton />;
  }

  if (completed && onSetup) {
    return null;
  }

  return <>{children}</>;
}
