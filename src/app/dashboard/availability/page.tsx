import { auth } from "@/auth";
import { db } from "@/db";
import { staff, availability } from "@/db/schema";
import { eq } from "drizzle-orm";
import AvailabilityEditor from "@/components/dashboard/AvailabilityEditor";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AvailabilityPage() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const staffList = await db.select().from(staff).where(eq(staff.businessId, businessId));

  const availabilityRows = staffList.length
    ? await db
        .select()
        .from(availability)
        .where(
          eq(
            availability.staffId,
            staffList[0].id // Loaded per-staff client-side, but seed with first
          )
        )
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Availability</h1>
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
