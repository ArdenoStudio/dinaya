import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import HolidaysEditor from "@/components/dashboard/HolidaysEditor";
import AvailabilityEditor from "@/components/dashboard/AvailabilityEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { requireBusiness } from "@/lib/auth";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  const { businessId } = await requireBusiness();

  const staffList = await db.select().from(staff).where(eq(staff.businessId, businessId));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Availability"
        description="Set weekly hours and time off for each team member."
      />
      {staffList.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-muted-foreground">Add a team member before setting booking hours.</p>
          <a
            href="/dashboard/staff/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Add staff
          </a>
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
