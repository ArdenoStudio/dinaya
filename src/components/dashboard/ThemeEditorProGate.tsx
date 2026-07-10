"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { themeEditorFeatureLabel, themeEditorPlanLabel } from "@/lib/plan-client";
import type { PlanFeature } from "@/lib/plan";

export function ThemeEditorProGateCard({ feature }: { feature: PlanFeature }) {
  const requiredPlan = themeEditorPlanLabel(feature);

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-4 text-sm dark:border-violet-800/50 dark:bg-violet-950/40">
      <div className="flex items-center gap-2 font-medium text-violet-950 dark:text-violet-100">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white">
          <Icon name="stars" className="text-sm" aria-hidden="true" />
        </span>
        Upgrade to {requiredPlan}
      </div>
      <p className="mt-2 text-violet-900/75 dark:text-violet-200/80">
        {themeEditorFeatureLabel(feature)} is available on Dinaya {requiredPlan}.
      </p>
      <Link
        href="/dashboard/billing"
        className="mt-3 inline-flex min-h-10 items-center rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        View plan options
      </Link>
    </div>
  );
}

export function ThemeEditorLockedSection({
  enabled,
  feature,
  children,
}: {
  enabled: boolean;
  feature: PlanFeature;
  children: React.ReactNode;
}) {
  if (enabled) return <>{children}</>;

  return (
    <div className="space-y-3">
      <div className="pointer-events-none select-none opacity-55" aria-hidden="true">
        {children}
      </div>
      <ThemeEditorProGateCard feature={feature} />
    </div>
  );
}
