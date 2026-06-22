import Link from "next/link";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Icon } from "@/components/ui/Icon";
import {
  formatOverviewActivityAge,
  overviewActionDot,
  overviewEntityIconMap,
  overviewStatusBadge,
  overviewStatusBorder,
  type DashboardOverviewData,
} from "@/lib/dashboard/overview-data";
import { cn } from "@/lib/utils";

type DashboardOverviewProps = {
  data: DashboardOverviewData;
};

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const firstName = data.businessName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          {data.greetingDate}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Good day, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s bookings, revenue, and setup progress.</p>
      </div>

      {data.showStats ? (
        <div className="grid gap-4 md:grid-cols-4">
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
        </div>
      ) : null}

      {data.showOnboarding ? (
        <OnboardingWizard
          steps={data.onboarding}
          bookingUrl={data.bookingUrl}
          whatsappShare={data.whatsappShare}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today timeline</h2>
            <Link href="/dashboard/calendar" className="text-sm text-primary hover:underline">
              Calendar
            </Link>
          </div>
          {data.todayRows.length === 0 ? (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">No bookings today.</p>
              {data.nextRows.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next appointments
                  </p>
                  {data.nextRows.map((row) => (
                    <Link
                      key={row.id}
                      href={`/dashboard/bookings/${row.id}`}
                      className="block rounded-md border bg-white px-3 py-2 text-sm hover:border-primary/40 dark:border-neutral-800 dark:bg-neutral-900"
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
            </div>
          ) : (
            <div className="space-y-3">
              {data.todayRows.map((row) => {
                const initials = row.clientName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const border = overviewStatusBorder[row.status] ?? "border-l-slate-200";
                const badge = overviewStatusBadge[row.status] ?? "bg-muted text-muted-foreground";
                return (
                  <Link
                    key={row.id}
                    href={`/dashboard/bookings/${row.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-l-4 px-4 py-3 transition-shadow hover:shadow-sm",
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
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize", badge)}>
                      {row.status.replace("_", " ")}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {data.showShareCard ? (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon name="link-45deg" className="text-sm" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Share booking link</p>
              </div>
              <code className="block truncate rounded-lg border border-primary/15 bg-white px-3 py-2 font-mono text-sm text-primary dark:bg-neutral-900">
                {data.bookingDisplayUrl}
              </code>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={data.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  Open
                </a>
                <a
                  href={data.whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  WhatsApp
                </a>
                <Link
                  href="/dashboard/marketing"
                  className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  QR & embed
                </Link>
              </div>
              <textarea
                readOnly
                value={data.embedSnippet}
                className="mt-3 h-16 w-full resize-none rounded-md border bg-white p-2 text-xs text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900"
              />
            </div>
          ) : null}

          <div className="rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 font-semibold">Recent activity</h2>
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
                      className="flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="relative mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <EntityIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className={cn("absolute -right-0.5 -top-0.5 size-2 rounded-full ring-1 ring-white", dot)} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
