"use client";

import Link from "next/link";
import { Clock, CreditCard, Pencil } from "lucide-react";
import { formatLkr } from "@/lib/utils";
import { minPriceVariantLkr, type ServicePriceVariant } from "@/lib/service-variants";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { dashboardOutlineActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export type ServicesTableRow = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceLkr: number;
  priceVariants: ServicePriceVariant[] | null;
  requiresPayment: boolean;
  depositPercent: number;
  beforeBuffer: number;
  afterBuffer: number;
  isActive: boolean;
};

export function ServicesTable({ rows }: { rows: ServicesTableRow[] }) {
  const columns: DataTableColumn<ServicesTableRow>[] = [
    {
      key: "name",
      header: "Service",
      render: (s) => (
        <div className="min-w-0">
          <p className="font-medium">{s.name}</p>
          {s.description ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.description}</p> : null}
          {s.beforeBuffer > 0 || s.afterBuffer > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Buffer: {s.beforeBuffer > 0 ? `${s.beforeBuffer}min before` : ""}
              {s.beforeBuffer > 0 && s.afterBuffer > 0 ? " / " : ""}
              {s.afterBuffer > 0 ? `${s.afterBuffer}min after` : ""}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (s) => (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="size-3.5" /> {s.durationMinutes} min
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (s) => (
        <div className="space-y-0.5">
          <span className="flex items-center gap-1">
            <CreditCard className="size-3.5 text-muted-foreground" />
            {minPriceVariantLkr(s.priceVariants) != null
              ? `From ${formatLkr(minPriceVariantLkr(s.priceVariants)!)}`
              : s.priceLkr > 0
                ? formatLkr(s.priceLkr)
                : "Free"}
          </span>
          {s.requiresPayment ? (
            <span className="block text-xs font-medium text-amber-600">
              {s.depositPercent > 0 ? `${s.depositPercent}% deposit` : "Payment required"}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            s.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
          )}
        >
          {s.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <Link href={`/dashboard/services/${s.id}`} className={cn(dashboardOutlineActionClass, "gap-1 px-2.5 py-1 text-xs")}>
          <Pencil className="size-3.5" /> Edit
        </Link>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} getRowId={(s) => s.id} />;
}
