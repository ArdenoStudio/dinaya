"use client";

import { useEffect, useState } from "react";
import { Banknote, CalendarCheck, TrendingUp, UserPlus } from "lucide-react";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import type {
  DashboardOverviewData,
  DashboardOverviewStat,
} from "@/lib/dashboard/overview-data";
import { desktopApiRequest } from "../desktop-api";
import type { PlanUsage } from "@/lib/dashboard-usage";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";

const statIcons: Record<string, DashboardOverviewStat["icon"]> = {
  "Today revenue": Banknote,
  "Today bookings": CalendarCheck,
  "Week revenue": TrendingUp,
  "New clients": UserPlus,
};

type SerializedOverview = Omit<DashboardOverviewData, "stats" | "todayRows" | "nextRows" | "recentActivity"> & {
  stats: Array<Omit<DashboardOverviewStat, "icon">>;
  todayRows: Array<Omit<DashboardOverviewData["todayRows"][number], "startsAt"> & { startsAt: string }>;
  nextRows: Array<Omit<DashboardOverviewData["nextRows"][number], "startsAt"> & { startsAt: string }>;
  recentActivity: Array<Omit<DashboardOverviewData["recentActivity"][number], "createdAt"> & { createdAt: string }>;
};

export type DesktopShellMeta = {
  language: DashboardLanguage;
  planUsage?: PlanUsage;
  trialDaysLeft: number | null;
};

type OverviewPayload = {
  overview: SerializedOverview;
  shell: DesktopShellMeta;
  serverTime: string;
};

function hydrateOverview(payload: SerializedOverview): DashboardOverviewData {
  return {
    ...payload,
    stats: payload.stats.map((stat) => ({
      ...stat,
      icon: statIcons[stat.label] ?? CalendarCheck,
    })),
    todayRows: payload.todayRows.map((row) => ({
      ...row,
      startsAt: new Date(row.startsAt),
    })),
    nextRows: payload.nextRows.map((row) => ({
      ...row,
      startsAt: new Date(row.startsAt),
    })),
    recentActivity: payload.recentActivity.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    })),
  };
}

export function DashboardOverviewPage({
  onShellMeta,
}: {
  onShellMeta?: (meta: DesktopShellMeta) => void;
}) {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void desktopApiRequest<OverviewPayload>({
      method: "GET",
      path: "/api/v1/desktop/overview",
    })
      .then((payload) => {
        if (cancelled) return;
        setData(hydrateOverview(payload.overview));
        onShellMeta?.(payload.shell);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(String(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onShellMeta]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
        {error ?? "Could not load overview."}
      </div>
    );
  }

  return <DashboardOverview data={data} />;
}
