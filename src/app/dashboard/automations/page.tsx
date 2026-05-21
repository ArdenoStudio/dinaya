import { ProGate } from "@/lib/plan";
import { requireOwner } from "@/lib/auth";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AutomationsClient } from "@/components/dashboard/AutomationsClient";

export default async function AutomationsPage() {
  const { businessId } = await requireOwner();
  const rules = await db
    .select({
      id: automationRules.id,
      name: automationRules.name,
      trigger: automationRules.trigger,
      delayMinutes: automationRules.delayMinutes,
      isActive: automationRules.isActive,
    })
    .from(automationRules)
    .where(eq(automationRules.businessId, businessId))
    .orderBy(desc(automationRules.createdAt));

  return (
    <ProGate businessId={businessId} feature="automations">
      <div className="space-y-6">
        <div>
          <h1 className="font-cal text-2xl">Automations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with reminder and follow-up templates. Rules run automatically on booking events; delayed steps are processed every 15 minutes.
          </p>
        </div>
        <AutomationsClient initialRules={rules} />
      </div>
    </ProGate>
  );
}
