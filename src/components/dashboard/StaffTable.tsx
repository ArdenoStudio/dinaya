"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { dashboardOutlineActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export type StaffTableRow = {
  id: string;
  name: string;
  bio: string | null;
  isActive: boolean;
};

export function StaffTable({ rows }: { rows: StaffTableRow[] }) {
  const columns: DataTableColumn<StaffTableRow>[] = [
    {
      key: "name",
      header: "Staff",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium">{s.name}</p>
            {s.bio ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.bio}</p> : null}
          </div>
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
        <Link href={`/dashboard/staff/${s.id}`} className={cn(dashboardOutlineActionClass, "gap-1 px-2.5 py-1 text-xs")}>
          <Pencil className="size-3.5" /> Edit
        </Link>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} getRowId={(s) => s.id} />;
}
