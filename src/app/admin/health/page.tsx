import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Gauge, XCircle } from "lucide-react";
import {
  fetchUptimeSummary,
  getUptimeSummarySources,
  type UptimeService,
} from "@/lib/uptime-monitor";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

function parsePct(s: string): number {
  return Number(String(s).replace("%", "")) || 0;
}

function UptimeUnavailable() {
  const sources = getUptimeSummarySources();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">System health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not load uptime data.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        <p>
          This page reads{" "}
          <code className="rounded bg-muted px-1 text-xs">history/summary.json</code>{" "}
          from the separate{" "}
          <code className="rounded bg-muted px-1 text-xs">dinaya-uptime-monitor</code>{" "}
          Upptime repo (updated by that repo&apos;s GitHub Actions, not this app).
        </p>
        <p className="mt-3">
          Set one of these in Vercel production env:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code className="rounded bg-muted px-1 text-xs">UPTIME_MONITOR_SUMMARY_URL</code>{" "}
            — full URL to summary.json
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-xs">UPTIME_MONITOR_GITHUB_REPO</code> +{" "}
            <code className="rounded bg-muted px-1 text-xs">UPTIME_MONITOR_GITHUB_BRANCH</code>{" "}
            (defaults to ArdenoStudio/dinaya-uptime-monitor @ master)
          </li>
          <li>
            <code className="rounded bg-muted px-1 text-xs">UPTIME_MONITOR_GITHUB_TOKEN</code>{" "}
            — if the monitor repo is private
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Tried:{" "}
          {sources.map((source) => (
            <code key={source} className="mr-2 block break-all rounded bg-muted px-1">
              {source}
            </code>
          ))}
          <span className="mt-1 block">
            Local fallback:{" "}
            <code className="rounded bg-muted px-1">dinaya-uptime-monitor/history/summary.json</code>
          </span>
        </p>
      </div>
    </div>
  );
}

export default async function AdminHealthPage() {
  await requirePlatformAdmin();
  const services = await fetchUptimeSummary();

  if (!services) {
    return <UptimeUnavailable />;
  }

  const upCount = services.filter((s) => s.status === "up").length;
  const downCount = services.filter((s) => s.status === "down").length;
  const degradedCount = services.filter(
    (s) => s.status !== "up" && s.status !== "down",
  ).length;

  const overallUp = services.length > 0 ? upCount === services.length : true;
  const avgResponseMs =
    services.length > 0
      ? Math.round(services.reduce((acc, s) => acc + s.time, 0) / services.length)
      : 0;
  const avgUptimeMonth =
    services.length > 0
      ? (
          services.reduce((acc, s) => acc + parsePct(s.uptimeMonth), 0) /
          services.length
        ).toFixed(2)
      : "0.00";

  const incidents: { date: string; service: string; minutesDown: number }[] = [];
  for (const s of services) {
    if (!s.dailyMinutesDown) continue;
    for (const [date, minutes] of Object.entries(s.dailyMinutesDown)) {
      incidents.push({ date, service: s.name, minutesDown: Number(minutes) });
    }
  }
  incidents.sort((a, b) => b.date.localeCompare(a.date));

  const tiles = [
    {
      label: "Overall status",
      value: overallUp ? "All systems up" : `${downCount} down`,
      sub: `${services.length} services monitored`,
      accent: overallUp ? "bg-emerald-500" : "bg-rose-500",
    },
    {
      label: "Services up",
      value: `${upCount}/${services.length}`,
      sub: degradedCount > 0 ? `${degradedCount} degraded` : "no degradation",
      accent: "bg-primary",
    },
    {
      label: "Avg response",
      value: `${avgResponseMs} ms`,
      sub: "across all monitors",
      accent: "bg-violet-600",
    },
    {
      label: "Avg uptime (30d)",
      value: `${avgUptimeMonth}%`,
      sub: "monthly average",
      accent: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-cal text-3xl tracking-tight">System health</h1>
          <span
            className={
              overallUp
                ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700"
                : "inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-700"
            }
          >
            {overallUp ? (
              <>
                <CheckCircle2 className="size-3" aria-hidden="true" /> Operational
              </>
            ) : (
              <>
                <XCircle className="size-3" aria-hidden="true" /> Incident in progress
              </>
            )}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Live data from the{" "}
          <code className="rounded bg-muted px-1 text-xs">dinaya-uptime-monitor</code> Upptime
          repo (refreshed every 5 minutes).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="overflow-hidden rounded-xl border bg-white">
            <div className={`h-[3px] ${t.accent}`} />
            <div className="p-5">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{t.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Services</h2>
        </div>
        <div className="divide-y">
          {services.map((s) => {
            const isUp = s.status === "up";
            const isDown = s.status === "down";
            return (
              <ServiceRow key={s.slug} service={s} isUp={isUp} isDown={isDown} />
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Gauge className="size-4 text-muted-foreground" aria-hidden="true" />
          Recent downtime
        </h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No downtime recorded in the available history.
          </p>
        ) : (
          <div className="space-y-2">
            {incidents.slice(0, 12).map((i, idx) => (
              <div
                key={`${i.date}-${i.service}-${idx}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{i.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(i.date), "d MMM yyyy")}
                  </p>
                </div>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {i.minutesDown} min down
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceRow({
  service: s,
  isUp,
  isDown,
}: {
  service: UptimeService;
  isUp: boolean;
  isDown: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3">
      <span
        className={
          isUp
            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
            : isDown
              ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600"
              : "flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600"
        }
      >
        {isUp ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : isDown ? (
          <XCircle className="size-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{s.name}</p>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-muted-foreground hover:text-foreground"
        >
          {s.url}
        </a>
      </div>
      <div className="text-right text-xs">
        <p className="font-semibold tabular-nums">
          {s.uptimeMonth}{" "}
          <span className="font-normal text-muted-foreground">30d</span>
        </p>
        <p className="text-muted-foreground">{s.time} ms</p>
      </div>
      <span
        className={
          isUp
            ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700"
            : isDown
              ? "rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-700"
              : "rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700"
        }
      >
        {s.status}
      </span>
    </div>
  );
}
