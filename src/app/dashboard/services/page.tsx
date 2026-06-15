import Link from "next/link";
import { formatLkr } from "@/lib/utils";
import { requireOwner } from "@/lib/auth";
import { getServicesDashboardList } from "@/lib/dashboard/services";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Scissors } from "lucide-react";

export default async function ServicesPage() {
  const { businessId } = await requireOwner();
  const { rows: list } = await getServicesDashboardList(businessId, { limit: 200 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Services</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/services/router"
            className="flex items-center gap-1.5 border px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Booking router
          </Link>
          <Link
            href="/dashboard/services/new"
            className="flex items-center gap-1.5 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md"
          >
            <Icon name="plus" className="text-xs" /> Add service
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services yet"
          description="Add the services clients can book — price, duration, and deposit rules."
          action={
            <Link
              href="/dashboard/services/new"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add your first service
            </Link>
          }
        />
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
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
                    {s.priceLkr > 0 ? formatLkr(s.priceLkr) : "Free"}
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/dashboard/services/${s.id}`}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
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
