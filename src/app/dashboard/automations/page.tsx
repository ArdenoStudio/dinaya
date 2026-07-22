import { ProGate } from "@/components/ProGate";
import { requireOwner } from "@/lib/auth";
import { getAutomationsDashboardList } from "@/lib/dashboard/automations";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AutomationsClient } from "@/components/dashboard/AutomationsClient";
import { dashboardPageClass } from "@/lib/dashboard-ui";

export default async function AutomationsPage() {
  const { businessId } = await requireOwner();
  const rules = await getAutomationsDashboardList(businessId, { limit: 200 });

  return (
    <ProGate businessId={businessId} feature="automations">
      <div className={dashboardPageClass}>
        <DashboardPageHeader
          title="Automations"
          description="Start with reminder and follow-up templates. Rules run automatically on booking events; delayed steps are processed every 15 minutes."
        />
        <AutomationsClient initialRules={rules.rows} />
      </div>
    </ProGate>
  );
}
