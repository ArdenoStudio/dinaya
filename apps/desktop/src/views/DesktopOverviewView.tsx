import { format } from "date-fns";
import { CalendarCheck, Clock3, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";

type BookingRow = {
  clientName: string;
  id: string;
  serviceName: string;
  staffName: string;
  startsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
};

type DashboardMetrics = {
  activeToday: number;
  confirmedToday: number;
  pendingToday: number;
  staffOnDeck: number;
};

const statusBorder: Record<string, string> = {
  confirmed: "border-l-blue-500",
  pending: "border-l-amber-400",
  completed: "border-l-green-500",
  no_show: "border-l-red-400",
  cancelled: "border-l-slate-300",
};

const statusBadge: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  no_show: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400",
};

const statusLabels: Record<BookingRow["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextBookingForRows(rows: BookingRow[], clock: Date): BookingRow | null {
  const now = clock.getTime();
  return (
    rows
      .filter((row) => new Date(row.startsAt).getTime() >= now && row.status !== "cancelled")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null
  );
}

export function DesktopOverviewView({
  businessName,
  lastSync,
  metrics,
  rows,
  staffCount,
  onCopyBookingLink,
  onExportDaySheet,
  onOpenBooking,
  onOpenBookings,
  onOpenCalendar,
  onPrintDaySheet,
}: {
  businessName: string;
  lastSync: string | null;
  metrics: DashboardMetrics;
  rows: BookingRow[];
  staffCount: number;
  onCopyBookingLink: () => void;
  onExportDaySheet: () => void;
  onOpenBooking: (id: string) => void;
  onOpenBookings: () => void;
  onOpenCalendar: () => void;
  onPrintDaySheet: () => void;
}) {
  const now = new Date();
  const nextBooking = nextBookingForRows(rows, now);
  const firstName = businessName.split(" ")[0] || businessName;

  const stats = [
    {
      delta: undefined,
      icon: CalendarCheck,
      label: "Active today",
      tone: "cobalt" as const,
      value: metrics.activeToday,
    },
    {
      delta: undefined,
      icon: Clock3,
      label: "Pending",
      tone: "amber" as const,
      value: metrics.pendingToday,
    },
    {
      delta: undefined,
      icon: CalendarCheck,
      label: "Confirmed",
      tone: "violet" as const,
      value: metrics.confirmedToday,
    },
    {
      delta: `${staffCount || 0} total`,
      icon: Users,
      label: "Staff on deck",
      tone: "slate" as const,
      value: `${metrics.staffOnDeck}/${staffCount || 0}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          {format(now, "EEEE, MMMM d")}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Good day, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s bookings and team load
          {lastSync ? ` · Synced ${formatTime(lastSync)}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            delta={stat.delta}
            icon={stat.icon}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Today timeline</h2>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={onOpenCalendar}
            >
              Calendar
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">No bookings today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.slice(0, 8).map((row) => {
                const initials = row.clientName
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => onOpenBooking(row.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-l-4 bg-white px-4 py-3 text-left transition-colors hover:border-primary/30 dark:border-neutral-800 dark:bg-neutral-900",
                      statusBorder[row.status] ?? "border-l-slate-200",
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{row.clientName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {formatTime(row.startsAt)} · {row.serviceName} with {row.staffName}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        statusBadge[row.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {statusLabels[row.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">Next up</p>
            {nextBooking ? (
              <div className="mt-3">
                <p className="text-lg font-semibold">{nextBooking.clientName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatTime(nextBooking.startsAt)} · {nextBooking.serviceName}
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-lg font-semibold">No active booking</p>
                <p className="mt-1 text-sm text-muted-foreground">{businessName} is clear for now.</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="mb-3 text-sm font-semibold">Quick actions</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={onOpenBookings}
              >
                Open bookings
              </button>
              <button
                type="button"
                className="rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-muted/50"
                onClick={onCopyBookingLink}
              >
                Copy booking link
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                  onClick={onPrintDaySheet}
                >
                  Print
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                  onClick={onExportDaySheet}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
