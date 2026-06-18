import Link from "next/link";
import { db } from "@/db";
import { bookings, clients, services } from "@/db/schema";
import { requireBusiness } from "@/lib/auth";
import { eq, ilike, or, and, desc } from "drizzle-orm";

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { businessId } = await requireBusiness();
  const q = ((await searchParams).q ?? "").trim();

  if (!q) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Enter a search term from the header to find bookings, clients, or services.</p>
      </div>
    );
  }

  const pattern = `%${q}%`;

  const [clientRows, bookingRows, serviceRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
      })
      .from(clients)
      .where(
        and(
          eq(clients.businessId, businessId),
          or(ilike(clients.name, pattern), ilike(clients.phone, pattern), ilike(clients.email, pattern)),
        ),
      )
      .orderBy(desc(clients.createdAt))
      .limit(10),
    db
      .select({
        id: bookings.id,
        clientName: bookings.clientName,
        startsAt: bookings.startsAt,
        status: bookings.status,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(
        and(
          eq(bookings.businessId, businessId),
          or(
            ilike(bookings.clientName, pattern),
            ilike(bookings.clientPhone, pattern),
            ilike(bookings.clientEmail, pattern),
            ilike(services.name, pattern),
          ),
        ),
      )
      .orderBy(desc(bookings.startsAt))
      .limit(10),
    db
      .select({ id: services.id, name: services.name, durationMinutes: services.durationMinutes })
      .from(services)
      .where(and(eq(services.businessId, businessId), ilike(services.name, pattern)))
      .orderBy(services.name)
      .limit(10),
  ]);

  const total = clientRows.length + bookingRows.length + serviceRows.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total === 0 ? "No matches" : `${total} result${total === 1 ? "" : "s"}`} for &ldquo;{q}&rdquo;
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Clients</h2>
        {clientRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching clients.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {clientRows.map((client) => (
              <li key={client.id}>
                <Link href={`/dashboard/clients/${client.id}`} className="block px-4 py-3 hover:bg-muted/40">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.phone}{client.email ? ` · ${client.email}` : ""}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bookings</h2>
        {bookingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching bookings.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {bookingRows.map((booking) => (
              <li key={booking.id}>
                <Link href={`/dashboard/bookings/${booking.id}`} className="block px-4 py-3 hover:bg-muted/40">
                  <p className="font-medium">{booking.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.serviceName} · {booking.startsAt.toLocaleString()} · {booking.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Services</h2>
        {serviceRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching services.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {serviceRows.map((service) => (
              <li key={service.id}>
                <Link href={`/dashboard/services/${service.id}`} className="block px-4 py-3 hover:bg-muted/40">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.durationMinutes} minutes</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
