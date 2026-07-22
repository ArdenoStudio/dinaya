import { ProGate } from "@/components/ProGate";
import { requireOwner } from "@/lib/auth";
import { getPaymentsDashboardList } from "@/lib/dashboard/payments";
import { formatLkr } from "@/lib/utils";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { CreditCard } from "lucide-react";

export default async function PaymentsPage() {
  const { businessId } = await requireOwner();
  const { rows } = await getPaymentsDashboardList(businessId, { limit: 100 });

  return (
    <ProGate businessId={businessId} feature="payments">
      <div className={dashboardPageClass}>
        <DashboardPageHeader
          title="Payments"
          description="PayHere payment attempts and collected revenue."
          actions={
            <Link href="/dashboard/settings" className={dashboardPrimaryActionClass}>
              PayHere setup
            </Link>
          }
        />

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
              render: (row) => <StatusBadge status={row.status} />,
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
