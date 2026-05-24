import { ProGate } from "@/lib/plan";
import { requireOwner } from "@/lib/auth";
import { db } from "@/db";
import { bookings, payments, services } from "@/db/schema";
import { formatLkr } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CreditCard } from "lucide-react";

export default async function PaymentsPage() {
  const { businessId } = await requireOwner();

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

        <DataTable
          rows={rows}
          getRowId={(row) => row.id}
          empty={
            <EmptyState
              icon={CreditCard}
              title="No payment records yet"
              description="Require payment on a service to collect deposits or full payment online."
              action={
                <Link
                  href="/dashboard/settings"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Set up PayHere
                </Link>
              }
            />
          }
          columns={[
            { key: "client", header: "Client", render: (row) => <span className="font-medium">{row.clientName}</span> },
            { key: "service", header: "Service", className: "text-muted-foreground", render: (row) => row.serviceName },
            { key: "amount", header: "Amount", render: (row) => <span className="tabular-nums">{formatLkr(row.amountLkr)}</span> },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                  {row.status}
                </span>
              ),
            },
            {
              key: "order",
              header: "Order",
              className: "text-xs text-muted-foreground",
              render: (row) => row.orderId ?? "-",
            },
            {
              key: "link",
              header: "",
              align: "right",
              render: (row) => (
                <Link href={`/dashboard/bookings/${row.bookingId}`} className="text-primary hover:underline">
                  Booking
                </Link>
              ),
            },
          ]}
        />
      </div>
    </ProGate>
  );
}
