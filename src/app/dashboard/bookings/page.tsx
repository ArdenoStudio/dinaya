import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, services, staff } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const COLOMBO_TZ = "Asia/Colombo";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
};

export default async function BookingsPage() {
  const session = await auth();
  const businessId = (session!.user as { businessId: string }).businessId;

  const rows = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      startsAt: bookings.startsAt,
      status: bookings.status,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(eq(bookings.businessId, businessId))
    .orderBy(desc(bookings.startsAt))
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Bookings</h1>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No bookings yet. Share your booking page to get started!
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const local = toZonedTime(row.startsAt, COLOMBO_TZ);
                return (
                  <tr key={row.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.clientName}</p>
                      <p className="text-xs text-muted-foreground">{row.clientPhone}</p>
                    </td>
                    <td className="px-4 py-3">{row.serviceName}</td>
                    <td className="px-4 py-3">{row.staffName}</td>
                    <td className="px-4 py-3">
                      <p>{format(local, "d MMM yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{format(local, "h:mm a")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[row.status] ?? ""}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
