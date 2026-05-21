import { ReviewsClient } from "@/components/dashboard/ReviewsClient";
import { requireOwner } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canUseFeature, type Plan } from "@/lib/plan";

export default async function ReviewsDashboardPage() {
  const { businessId } = await requireOwner();
  const [business] = await db
    .select({ plan: businesses.plan })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return (
    <ReviewsClient canUseAiReplies={canUseFeature((business?.plan ?? "free") as Plan, "reviewReplies")} />
  );
}
