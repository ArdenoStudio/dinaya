import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getStaffDashboardList } from "@/lib/dashboard/staff";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { StaffInviteForm } from "@/components/dashboard/StaffInviteForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { dashboardOutlineActionClass, dashboardPageClass, dashboardPrimaryActionClass, dashboardSurfaceClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { UserRoundCheck } from "lucide-react";

export default async function StaffPage() {
  const { businessId } = await requireOwner();
  const { rows: list } = await getStaffDashboardList(businessId, { limit: 200 });

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Staff"
        actions={
          <Link href="/dashboard/staff/new" className={dashboardPrimaryActionClass}>
            <Icon name="plus" className="text-xs" /> Add staff
          </Link>
        }
      />

      <StaffInviteForm />

      {list.length === 0 ? (
        <EmptyState
          icon={UserRoundCheck}
          title="No staff yet"
          description="Add team members so bookings can be assigned and availability can be managed."
          action={
            <Link href="/dashboard/staff/new" className={dashboardPrimaryActionClass}>
              <Icon name="plus" className="text-xs" /> Add your first team member
            </Link>
          }
        />
      ) : (
        <div className={cn(dashboardSurfaceClass, "divide-y overflow-hidden")}>
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.name}</p>
                {s.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{s.bio}</p>}
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  s.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
                )}
              >
                {s.isActive ? "Active" : "Inactive"}
              </span>
              <Link
                href={`/dashboard/staff/${s.id}`}
                className={cn(dashboardOutlineActionClass, "gap-1 px-2.5 py-1 text-xs")}
              >
                <Icon name="pencil" /> Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
