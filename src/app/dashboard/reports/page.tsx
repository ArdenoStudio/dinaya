import { ProGate } from "@/components/ProGate";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { DealAnalyticsPanel } from "@/components/dashboard/DealAnalyticsPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { getReportsDashboardOverview } from "@/lib/dashboard/reports";
import { getDealAnalytics } from "@/lib/deals/analytics";
import { requireBusiness } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BarChart3, CalendarDays, Star, Users } from "lucide-react";

const emptyDealAnalytics = {
  bestDeal: null,
  conversionRatePercent: null,
  dealAttributedRevenueLkr: 0,
  dealBookingsCount: 0,
  dealsPostedThisMonth: 0,
  redemptionsByDiscount: [],
  totalRedemptions: 0,
};

function emptyReportsOverview(businessId: string) {
  const generatedAt = new Date().toISOString();
  return {
    breakdowns: {
      bookingsBySource: [],
      bookingsByStatus: [],
      revenueByDay: [],
      revenueByService: [],
      staffLoad: [],
      topClients: [],
    },
    business: {
      id: businessId,
      name: "Dinaya",
      timezone: "Asia/Colombo",
    },
    export: {
      csv: "Metric,Value\nRevenue,0\nBookings,0",
      filename: "dinaya-reports-fallback.csv",
      generatedAt,
    },
    metrics: {
      averageRating: 0,
      cancellationRate: 0,
      cancelledBookings: 0,
      completedBookings: 0,
      newClients: 0,
      noShowRate: 0,
      noShows: 0,
      totalBookings: 0,
      totalClients: 0,
      totalRevenueLabel: "LKR 0",
      totalRevenueLkr: 0,
    },
    range: {
      from: generatedAt.slice(0, 10),
      to: generatedAt.slice(0, 10),
    },
    trends: {
      busiestHours: [],
      revenueByWeekday: [
        { day: "Mon", lastWeek: 0, thisWeek: 0 },
        { day: "Tue", lastWeek: 0, thisWeek: 0 },
        { day: "Wed", lastWeek: 0, thisWeek: 0 },
        { day: "Thu", lastWeek: 0, thisWeek: 0 },
        { day: "Fri", lastWeek: 0, thisWeek: 0 },
        { day: "Sat", lastWeek: 0, thisWeek: 0 },
        { day: "Sun", lastWeek: 0, thisWeek: 0 },
      ],
    },
  };
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}${suffix}`;
}

function initialsFor(value: string) {
  return (
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function ReportsPage() {
  const { businessId } = await requireBusiness();

  return (
    <ProGate businessId={businessId} feature="reports">
      <ReportsOverview businessId={businessId} />
    </ProGate>
  );
}

async function ReportsOverview({ businessId }: { businessId: string }) {
  const [reports, dealAnalytics] = await Promise.all([
    getReportsDashboardOverview(businessId).catch(() => emptyReportsOverview(businessId)),
    getDealAnalytics(businessId).catch(() => emptyDealAnalytics),
  ]);

  const { breakdowns, metrics, trends } = reports;
  const maxHealthCount = Math.max(
    metrics.completedBookings,
    metrics.cancelledBookings,
    metrics.noShows,
    1,
  );
  const maxSourceCount = Math.max(...breakdowns.bookingsBySource.map((row) => row.value), 1);
  const maxStaffCount = Math.max(...breakdowns.staffLoad.map((row) => row.value), 1);
  const bookingHealth = [
    { name: "Completed", value: metrics.completedBookings },
    { name: "Cancelled", value: metrics.cancelledBookings },
    { name: "No-show", value: metrics.noShows },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-2xl">Analytics & Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue trends, booking patterns, client spend, and staff workload.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Revenue"
          value={metrics.totalRevenueLabel}
          icon={BarChart3}
          tone="cobalt"
        />
        <StatCard
          label="Bookings"
          value={metrics.totalBookings}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Clients"
          value={metrics.totalClients}
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="Avg. rating"
          value={metrics.averageRating.toFixed(1)}
          icon={Star}
          tone="violet"
        />
      </div>

      <AnalyticsCharts
        revenueByDay={trends.revenueByWeekday}
        revenueByService={breakdowns.revenueByService.map((row) => ({
          name: row.label,
          value: row.value,
        }))}
        busiestHours={trends.busiestHours.map((row) => ({
          name: formatHour(row.hour),
          value: row.value,
        }))}
        bookingHealth={bookingHealth}
        topClients={breakdowns.topClients.map((row) => ({
          name: row.label,
          spend: row.value,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Booking health summary</h2>
          <div className="space-y-4">
            {[
              {
                label: "Completed",
                value: metrics.completedBookings,
                color: "bg-green-500",
                text: "text-green-700",
              },
              {
                label: "Cancelled",
                value: metrics.cancelledBookings,
                color: "bg-amber-400",
                text: "text-amber-700",
              },
              {
                label: "No-show",
                value: metrics.noShows,
                color: "bg-red-400",
                text: "text-red-600",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className={cn("font-semibold", item.text)}>{item.value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", item.color)}
                    style={{ width: `${Math.round((item.value / maxHealthCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-muted/40 py-3 text-center">
                <p className="text-lg font-semibold">{metrics.cancellationRate}%</p>
                <p className="text-xs text-muted-foreground">Cancellation rate</p>
              </div>
              <div className="rounded-lg bg-muted/40 py-3 text-center">
                <p className="text-lg font-semibold">{metrics.noShowRate}%</p>
                <p className="text-xs text-muted-foreground">No-show rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Bookings by source</h2>
          {breakdowns.bookingsBySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {breakdowns.bookingsBySource.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{row.label}</span>
                    <span className="text-muted-foreground">{row.value} bookings</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.round((row.value / maxSourceCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Bookings by staff</h2>
          {breakdowns.staffLoad.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {breakdowns.staffLoad.map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-600">
                        {initialsFor(row.label)}
                      </span>
                      <span className="font-medium">{row.label}</span>
                    </div>
                    <span className="text-muted-foreground">{row.value} bookings</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-violet-500/60"
                      style={{ width: `${Math.round((row.value / maxStaffCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DealAnalyticsPanel analytics={dealAnalytics} />
    </div>
  );
}
