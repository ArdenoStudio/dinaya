import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Activity, ArrowUpRight, CalendarPlus } from "lucide-react";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { OnboardingCelebration } from "@/components/dashboard/OnboardingCelebration";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatGrid } from "@/components/dashboard/DashboardStatGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { statusBorderStyles } from "@/lib/dashboard-status";
import { Icon } from "@/components/ui/Icon";
import {
  formatOverviewActivityAge,
  overviewActionDot,
  overviewEntityIconMap,
  type DashboardOverviewData,
} from "@/lib/dashboard/overview-data";
import {
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type DashboardOverviewProps = {
  data: DashboardOverviewData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const firstName = data.businessName.split(" ")[0];

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        size="lg"
        eyebrow={data.greetingDate}
        title={`Good day, ${firstName}`}
        description="Today’s bookings, revenue, and what needs attention."
        actions={
          <>
            <Link href="/dashboard/bookings/new" className={dashboardPrimaryActionClass}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              New booking
            </Link>
            <Link href="/dashboard/calendar" className={dashboardOutlineActionClass}>
              Calendar
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        }
      />

      {data.showStats ? (
        <DashboardStatGrid>
          {data.stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              delta={stat.delta}
            />
          ))}
        </DashboardStatGrid>
      ) : null}

      <Suspense fallback={null}>
        <OnboardingCelebration bookingUrl={data.bookingUrl} bookingDisplayUrl={data.bookingDisplayUrl} />
      </Suspense>

      {data.showOnboarding ? (
        <OnboardingWizard
          steps={data.onboarding}
          bookingUrl={data.bookingUrl}
          whatsappShare={data.whatsappShare}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <DashboardSection
          title="Today timeline"
          action={
            <Link href="/dashboard/calendar" className="text-sm font-medium text-primary hover:underline">
              Open calendar
            </Link>
          }
        >
          {data.todayRows.length === 0 ? (
            <EmptyState
              title="No bookings today"
              description={
                data.nextRows.length > 0
                  ? "You’re clear for now — upcoming appointments are listed below."
                  : "When clients book, they’ll show up here with status and time."
              }
              action={
                <Link href="/dashboard/bookings/new" className={dashboardPrimaryActionClass}>
                  Create booking
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.todayRows.map((row) => {
                const initials = row.clientName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const border = statusBorderStyles[row.status] ?? "border-l-slate-200";
                return (
                  <Link
                    key={row.id}
                    href={`/dashboard/bookings/${row.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-l-4 px-4 py-3 transition-shadow hover:shadow-sm",
                      border,
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </span>
                    <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-primary">
                      {format(row.startsAt, "h:mm a")}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{row.clientName}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {row.serviceName} with {row.staffName}
                      </span>
                    </span>
                    <StatusBadge status={row.status} />
                  </Link>
                );
              })}
            </div>
          )}

          {data.todayRows.length === 0 && data.nextRows.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next appointments
              </p>
              {data.nextRows.map((row) => (
                <Link
                  key={row.id}
                  href={`/dashboard/bookings/${row.id}`}
                  className="block rounded-xl border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/40"
                >
                  <span className="font-medium">{row.clientName}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    - {row.serviceName} on {format(row.startsAt, "d MMM, h:mm a")}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </DashboardSection>

        <div className="space-y-6">
          {data.showShareCard ? (
            <DashboardSection muted title="Share booking link">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name="link-45deg" className="text-sm" aria-hidden="true" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Put this everywhere clients find you.
                </p>
              </div>
              <code className="block truncate rounded-xl border border-primary/15 bg-background px-3 py-2 font-mono text-sm text-primary">
                {data.bookingDisplayUrl}
              </code>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={data.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={dashboardOutlineActionClass}
                >
                  Open
                </a>
                <a
                  href={data.whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={dashboardOutlineActionClass}
                >
                  WhatsApp
                </a>
                <Link href="/dashboard/marketing" className={dashboardOutlineActionClass}>
                  QR & embed
                </Link>
              </div>
              <textarea
                readOnly
                value={data.embedSnippet}
                className="mt-3 h-16 w-full resize-none rounded-xl border bg-background p-2 text-xs text-muted-foreground"
              />
            </DashboardSection>
          ) : null}

          <DashboardSection title="Recent activity">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((item, index) => {
                  const EntityIcon = overviewEntityIconMap[item.entity] ?? Activity;
                  const dot = overviewActionDot[item.action] ?? "bg-slate-300";
                  return (
                    <div
                      key={`${item.entity}-${item.createdAt.toISOString()}-${index}`}
                      className="flex items-start gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <EntityIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span
                          className={cn(
                            "absolute -right-0.5 -top-0.5 size-2 rounded-full ring-1 ring-card",
                            dot,
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">
                          {item.entity}{" "}
                          <span className="font-normal text-muted-foreground">
                            {item.action.replace(/_/g, " ")}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatOverviewActivityAge(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </div>
  );
}
