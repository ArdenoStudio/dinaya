import { format } from "date-fns";
import { BookOpen, Download, Printer } from "lucide-react";
import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

type BookingRow = {
  clientEmail: string | null;
  clientName: string;
  clientPhone: string;
  endsAt: string;
  id: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  status: BookingStatus;
};

type BookingDetail = BookingRow & {
  clientId: string | null;
  notes: string | null;
};

type StaffMember = {
  id: string;
  isActive: boolean;
  name: string;
};

type Tab = "today" | "upcoming" | "past";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  no_show: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const transitionsFor = (status: BookingStatus): BookingStatus[] => {
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["completed", "no_show", "cancelled"];
  return [];
};

function formatDateTime(value: string): string {
  return format(new Date(value), "d MMM yyyy, h:mm a");
}

export function DesktopBookingsView({
  detail,
  rows,
  selectedId,
  staff,
  staffFilter,
  statusFilter,
  tab,
  onApply,
  onExport,
  onOpenBooking,
  onOpenWeb,
  onPrint,
  onStaffFilter,
  onStatus,
  onStatusFilter,
  onTab,
}: {
  detail: BookingDetail | null;
  rows: BookingRow[];
  selectedId: string | null;
  staff: StaffMember[];
  staffFilter: string;
  statusFilter: string;
  tab: Tab;
  onApply: () => void;
  onExport: () => void;
  onOpenBooking: (id: string) => void;
  onOpenWeb: (id: string) => void;
  onPrint: () => void;
  onStaffFilter: (value: string) => void;
  onStatus: (id: string, status: BookingStatus) => void;
  onStatusFilter: (value: string) => void;
  onTab: (tab: Tab) => void;
}) {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bookings"
        description="Review today, upcoming, and past appointments."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={onPrint}
            >
              <Printer className="size-4" aria-hidden="true" />
              Print
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={onExport}
            >
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTab(item.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground hover:text-foreground dark:bg-neutral-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Staff</span>
          <select
            className="min-w-[10rem] rounded-md border bg-background px-3 py-2 text-sm"
            value={staffFilter}
            onChange={(event) => onStaffFilter(event.target.value)}
          >
            <option value="">All staff</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Status</span>
          <select
            className="min-w-[10rem] rounded-md border bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => onStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onApply}
        >
          Apply filters
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{rows.length} bookings in this view</p>
          <DataTable
            rows={rows}
            getRowId={(row) => row.id}
            empty={
              <EmptyState
                icon={BookOpen}
                title="No bookings in this view"
                description="Try another tab or adjust your filters."
              />
            }
            columns={[
              {
                header: "When",
                key: "when",
                render: (row) => (
                  <button
                    type="button"
                    className="text-left font-medium hover:text-primary"
                    onClick={() => onOpenBooking(row.id)}
                  >
                    {formatDateTime(row.startsAt)}
                  </button>
                ),
              },
              {
                header: "Client",
                key: "client",
                render: (row) => row.clientName,
              },
              {
                header: "Service",
                key: "service",
                render: (row) => (
                  <span>
                    {row.serviceName}
                    <span className="block text-xs text-muted-foreground">{row.staffName}</span>
                  </span>
                ),
              },
              {
                header: "Status",
                key: "status",
                render: (row) => (
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLES[row.status],
                    )}
                  >
                    {statusLabels[row.status]}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <aside className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          {!selectedId ? (
            <EmptyState
              icon={BookOpen}
              title="Select a booking"
              description="Choose a booking from the list to review details and update status."
            />
          ) : !detail ? (
            <p className="text-sm text-muted-foreground">Loading booking…</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{detail.clientName}</h2>
                  <p className="text-sm text-muted-foreground">{detail.serviceName}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    STATUS_STYLES[detail.status],
                  )}
                >
                  {statusLabels[detail.status]}
                </span>
              </div>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">When</dt>
                  <dd className="font-medium">{formatDateTime(detail.startsAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Staff</dt>
                  <dd className="font-medium">{detail.staffName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{detail.clientPhone || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{detail.clientEmail || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium">{detail.notes || "No notes"}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2">
                {transitionsFor(detail.status).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                    onClick={() => onStatus(detail.id, status)}
                  >
                    Mark {statusLabels[status].toLowerCase()}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                  onClick={() => onOpenWeb(detail.id)}
                >
                  Open in browser
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
