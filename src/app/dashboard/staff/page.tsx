import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getStaffDashboardList } from "@/lib/dashboard/staff";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { StaffInviteForm } from "@/components/dashboard/StaffInviteForm";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StaffTable } from "@/components/dashboard/StaffTable";
import { dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { Plus, UserRoundCheck } from "lucide-react";

export default async function StaffPage() {
  const { businessId } = await requireOwner();
  const { rows: list } = await getStaffDashboardList(businessId, { limit: 200 });

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Staff"
        actions={
          <Link href="/dashboard/staff/new" className={dashboardPrimaryActionClass}>
            <Plus className="size-3.5" /> Add staff
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
              <Plus className="size-3.5" /> Add your first team member
            </Link>
          }
        />
      ) : (
        <StaffTable rows={list.map((s) => ({ id: s.id, name: s.name, bio: s.bio, isActive: s.isActive }))} />
      )}
    </div>
  );
}
