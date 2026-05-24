import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const { businessId, role } = await requireBusiness();

  if (role !== "owner") {
    redirect("/dashboard");
  }

  const [business] = await db
    .select({ onboardingCompletedAt: businesses.onboardingCompletedAt })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (business?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return <SetupWizard />;
}
