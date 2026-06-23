"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SetupWizardSkeleton } from "@/components/dashboard/SetupWizardSkeleton";

export function OnboardingGate({
  completed,
  role,
  children,
}: {
  completed: boolean;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onSetup = pathname.startsWith("/dashboard/setup");
  const isOwner = role === "owner";

  useEffect(() => {
    if (!completed && isOwner && !onSetup) {
      router.replace("/dashboard/setup");
      return;
    }
    if (completed && onSetup) {
      router.replace("/dashboard");
    }
  }, [completed, isOwner, onSetup, router]);

  if (!completed && isOwner && !onSetup) {
    return <SetupWizardSkeleton />;
  }

  if (completed && onSetup) {
    return null;
  }

  return <>{children}</>;
}
