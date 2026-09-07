import Link from "next/link";
import { formatLkr } from "@/lib/utils";
import { minPriceVariantLkr } from "@/lib/service-variants";
import { requireOwner } from "@/lib/auth";
import { getServicesDashboardList } from "@/lib/dashboard/services";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Scissors } from "lucide-react";
import {
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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
              <Icon name="plus" className="text-xs" /> Add service
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
              <Icon name="plus" className="text-xs" /> Add your first service
            </Link>
          }
        />
      ) : (
        <div className={cn(dashboardSurfaceClass, "divide-y overflow-hidden")}>
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/20">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="clock" />
                    {s.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="credit-card" />
                    {minPriceVariantLkr(s.priceVariants) != null
                      ? `From ${formatLkr(minPriceVariantLkr(s.priceVariants)!)}`
                      : s.priceLkr > 0
                        ? formatLkr(s.priceLkr)
                        : "Free"}
                  </span>
                  {s.requiresPayment && (
                    <span className="text-amber-600 font-medium">
                      {s.depositPercent > 0 ? `${s.depositPercent}% deposit` : "Payment required"}
                    </span>
                  )}
                  {(s.beforeBuffer > 0 || s.afterBuffer > 0) && (
                    <span>
                      Buffer:{" "}
                      {s.beforeBuffer > 0 ? `${s.beforeBuffer}min before` : ""}
                      {s.beforeBuffer > 0 && s.afterBuffer > 0 ? " / " : ""}
                      {s.afterBuffer > 0 ? `${s.afterBuffer}min after` : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    s.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/dashboard/services/${s.id}`}
                  className={cn(dashboardOutlineActionClass, "gap-1 px-2.5 py-1 text-xs")}
                >
                  <Icon name="pencil" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
