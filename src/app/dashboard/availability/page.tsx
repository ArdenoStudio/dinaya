import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";
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
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          Add staff first before setting availability.
        </div>
      ) : (
        <AvailabilityEditor staffList={staffList} dayNames={DAY_NAMES} />
      )}
    </div>
  );
}
