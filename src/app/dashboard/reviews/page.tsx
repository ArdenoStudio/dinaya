import { ReviewsClient } from "@/components/dashboard/ReviewsClient";
import { requireOwner } from "@/lib/auth";
import { canUseFeature } from "@/lib/plan";

export default async function ReviewsDashboardPage() {
  const { business } = await requireOwner();

  return (
    <ReviewsClient canUseAiReplies={canUseFeature(business.plan, "reviewReplies")} />
  );
}
