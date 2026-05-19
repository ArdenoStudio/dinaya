import { ProGate } from "@/lib/plan";
import { requireBusiness } from "@/lib/auth";
import { db } from "@/db";
import { bookings, payments, services } from "@/db/schema";
import { formatLkr } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function PaymentsPage() {
  const { businessId } = await requireBusiness();

  const rows = await db
    .select({
      id: payments.id,
      amountLkr: payments.amountLkr,
      bookingId: payments.bookingId,
      clientName: bookings.clientName,
      createdAt: payments.createdAt,
      orderId: payments.payhereOrderId,
      serviceName: services.name,
      status: payments.status,
    })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .where(eq(bookings.businessId, businessId))
    .orderBy(desc(payments.createdAt))
    .limit(100);

  return (
    <ProGate businessId={businessId} feature="payments">
      <div>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-cal text-2xl">Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              PayHere payment attempts and collected revenue.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            PayHere setup
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-sm text-muted-foreground">
            No payment records yet. Require payment on a service to collect deposits or full payment.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">{row.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.serviceName}</td>
                    <td className="px-4 py-3 tabular-nums">{formatLkr(row.amountLkr)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.orderId ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/bookings/${row.bookingId}`} className="text-primary hover:underline">
                        Booking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProGate>
  );
}
