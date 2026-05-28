import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  canUseFeature,
  getBusinessPlan,
  minimumPlanForFeature,
  planDisplayName,
  planFeatureLabel,
  type Plan,
  type PlanFeature,
} from "@/lib/plan";

export async function ProGate({
  businessId,
  children,
  feature,
}: {
  businessId?: string;
  children: ReactNode;
  feature: PlanFeature;
}) {
  const plan = businessId
    ? await getBusinessPlan(businessId)
    : (await import("@/lib/auth")).requireBusiness().then((ctx) => ctx.business.plan as Plan);

  if (canUseFeature(await plan, feature)) {
    return <>{children}</>;
  }

  const requiredPlan = minimumPlanForFeature(feature);

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-5 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-violet-950">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-violet-600 text-white">
          <Icon name="stars" className="text-sm" aria-hidden="true" />
        </span>
        Upgrade to {planDisplayName(requiredPlan)}
      </div>
      <p className="text-violet-900/75">
        {planFeatureLabel(feature)} is available on Dinaya {planDisplayName(requiredPlan)}.
      </p>
      <a
        href="/dashboard/billing"
        className="mt-4 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        View plan options
      </a>
    </div>
  );
}
