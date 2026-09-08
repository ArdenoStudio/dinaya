"use client";

import Link from "next/link";
import { formatLkr } from "@/lib/utils";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreditCard } from "lucide-react";
import { dashboardPrimaryActionClass } from "@/lib/dashboard-ui";

export type PaymentsTableRow = {
  id: string;
  clientName: string;
  serviceName: string;
  amountLkr: number;
  status: string;
  orderId: string | null;
  bookingId: string;
};

export function PaymentsTable({ rows }: { rows: PaymentsTableRow[] }) {
  const columns: DataTableColumn<PaymentsTableRow>[] = [
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
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      empty={
        <EmptyState
          icon={CreditCard}
          title="No payment records yet"
          description="Require payment on a service to collect deposits or full payment online."
          action={
            <Link href="/dashboard/settings" className={dashboardPrimaryActionClass}>
              Set up PayHere
            </Link>
          }
        />
      }
    />
  );
}
