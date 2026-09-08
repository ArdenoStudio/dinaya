import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getServicesDashboardList } from "@/lib/dashboard/services";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ServicesTable } from "@/components/dashboard/ServicesTable";
import { Plus, Scissors } from "lucide-react";
import { dashboardOutlineActionClass, dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";

export default async function ServicesPage() {
  const { businessId } = await requireOwner();
  const { rows: list } = await getServicesDashboardList(businessId, { limit: 200 });

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Services"
        actions={
          <>
            <Link href="/dashboard/services/router" className={dashboardOutlineActionClass}>
              Booking router
            </Link>
            <Link href="/dashboard/services/new" className={dashboardPrimaryActionClass}>
              <Plus className="size-3.5" /> Add service
            </Link>
          </>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services yet"
          description="Add the services clients can book — price, duration, and deposit rules."
          action={
            <Link href="/dashboard/services/new" className={dashboardPrimaryActionClass}>
              <Plus className="size-3.5" /> Add your first service
            </Link>
          }
        />
      ) : (
        <ServicesTable
          rows={list.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            durationMinutes: s.durationMinutes,
            priceLkr: s.priceLkr,
            priceVariants: s.priceVariants,
            requiresPayment: s.requiresPayment,
            depositPercent: s.depositPercent,
            beforeBuffer: s.beforeBuffer,
            afterBuffer: s.afterBuffer,
            isActive: s.isActive,
          }))}
        />
      )}
    </div>
  );
}
