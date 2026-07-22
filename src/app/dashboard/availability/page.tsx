import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import HolidaysEditor from "@/components/dashboard/HolidaysEditor";
import AvailabilityEditor from "@/components/dashboard/AvailabilityEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { requireBusiness } from "@/lib/auth";
import {
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  const { businessId } = await requireBusiness();

  const staffList = await db.select().from(staff).where(eq(staff.businessId, businessId));

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Availability"
        description="Set weekly hours and time off for each team member."
      />
      {staffList.length === 0 ? (
        <div className={cn(dashboardSurfaceClass, "p-12 text-center")}>
          <p className="text-muted-foreground">Add a team member before setting booking hours.</p>
          <Link href="/dashboard/staff/new" className={cn(dashboardPrimaryActionClass, "mt-4")}>
            Add staff
          </Link>
        </div>
      ) : (
        <>
          <HolidaysEditor />
          <AvailabilityEditor staffList={staffList} dayNames={DAY_NAMES} />
        </>
      )}
    </div>
  );
}
