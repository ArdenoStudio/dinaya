/**
 * Seeds a demo client with a completed booking 31+ days ago for AI reactivation demos.
 *
 * Usage: npx tsx scripts/seed-reactivation-demo.ts <businessId> [clientPhone]
 */
import { subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { bookings, clients, services, staff } from "../src/db/schema";

async function main() {
  const businessId = process.argv[2];
  const clientPhone = process.argv[3] ?? "+94771234567";

  if (!businessId) {
    console.error("Usage: npx tsx scripts/seed-reactivation-demo.ts <businessId> [clientPhone]");
    process.exit(1);
  }

  const [service] = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.businessId, businessId))
    .limit(1);

  const [staffMember] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(eq(staff.businessId, businessId))
    .limit(1);

  if (!service || !staffMember) {
    console.error("Business needs at least one service and staff member.");
    process.exit(1);
  }

  const [client] = await db
    .insert(clients)
    .values({
      businessId,
      name: "Demo Reactivation Client",
      phone: clientPhone,
      email: "demo-client@example.com",
      stage: "active",
      source: "demo",
    })
    .onConflictDoUpdate({
      target: [clients.businessId, clients.phone],
      set: { name: "Demo Reactivation Client", stage: "active" },
    })
    .returning({ id: clients.id });

  const startsAt = subDays(new Date(), 35);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  const [booking] = await db
    .insert(bookings)
    .values({
      businessId,
      clientId: client.id,
      serviceId: service.id,
      staffId: staffMember.id,
      clientName: "Demo Reactivation Client",
      clientPhone,
      clientEmail: "demo-client@example.com",
      startsAt,
      endsAt,
      status: "completed",
      source: "demo",
    })
    .returning({ id: bookings.id });

  console.log(JSON.stringify({ clientId: client.id, bookingId: booking.id, startsAt }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
