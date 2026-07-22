"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, UserCheck, UserPlus, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardStatGrid } from "@/components/dashboard/DashboardStatGrid";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Icon } from "@/components/ui/Icon";
import {
  dashboardFilterPillClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Stage = "lead" | "prospect" | "active" | "churned";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  stage: Stage;
  source: string | null;
  createdAt: string;
};

const STAGES: { key: "" | Stage; label: string }[] = [
  { key: "", label: "All" },
  { key: "lead", label: "Lead" },
  { key: "prospect", label: "Prospect" },
  { key: "active", label: "Active" },
  { key: "churned", label: "Churned" },
];

const STAGE_STYLES: Record<Stage, string> = {
  lead: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 ring-1 ring-inset ring-blue-700/20",
  prospect: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-700/20",
  active: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 ring-1 ring-inset ring-emerald-700/20",
  churned: "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 ring-1 ring-inset ring-gray-400/20",
};

const STAGE_DOT: Record<Stage, string> = {
  lead: "bg-blue-500",
  prospect: "bg-violet-500",
  active: "bg-emerald-500",
  churned: "bg-gray-400",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [stage, setStage] = useState<"" | Stage>("");
  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (q) params.set("q", q);
    fetch(`/api/dashboard/clients?${params}`)
      .then((r) => r.json())
      .then((data: Client[]) => {
        setClients(data);
        if (!stage && !q) setAllClients(data);
        setLoading(false);
      });
  }, [stage, q]);

  const stats = useMemo(() => {
    const source = allClients.length ? allClients : clients;
    const by = (s: Stage) => source.filter((c) => c.stage === s).length;
    return {
      total: source.length,
      active: by("active"),
      leads: by("lead"),
      prospects: by("prospect"),
    };
  }, [allClients, clients]);

  function exportCsv() {
    const headers = ["Name", "Phone", "Email", "Stage", "Source", "Created"];
    const rows = clients.map((c) => [
      c.name,
      c.phone,
      c.email ?? "",
      c.stage,
      c.source ?? "",
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "clients.csv";
    a.click();
  }

  function clearFilters() {
    setQ("");
    setStage("");
  }

  const isFiltering = !loading && (q || stage);
  const showEmptyAll = !loading && allClients.length === 0 && !isFiltering;
  const showEmptyFiltered = !loading && clients.length === 0 && isFiltering;

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        size="lg"
        title="Clients"
        description="Manage your customer list, track leads, and grow your business."
        actions={
          <>
            <button
              type="button"
              onClick={exportCsv}
              disabled={clients.length === 0}
              className={cn(dashboardOutlineActionClass, "disabled:cursor-not-allowed disabled:opacity-40")}
            >
              <Icon name="download" className="text-xs" /> Export CSV
            </button>
            <Link href="/dashboard/clients/new" className={dashboardPrimaryActionClass}>
              <Icon name="plus" className="text-xs" /> Add customer
            </Link>
          </>
        }
      />

      <DashboardStatGrid>
        <StatCard label="Total customers" value={loading ? "—" : stats.total} icon={Users} tone="cobalt" />
        <StatCard label="Active" value={loading ? "—" : stats.active} icon={UserCheck} tone="emerald" />
        <StatCard label="Leads" value={loading ? "—" : stats.leads} icon={UserPlus} tone="cobalt" />
        <StatCard label="Prospects" value={loading ? "—" : stats.prospects} icon={Sparkles} tone="violet" />
      </DashboardStatGrid>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search customers"
            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-8 text-base transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm dark:bg-neutral-900"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="x-lg" className="text-xs" />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Filter by stage">
          {STAGES.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={stage === s.key}
              onClick={() => setStage(s.key)}
              className={dashboardFilterPillClass(stage === s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-muted/40 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-36 bg-muted/40 rounded animate-pulse" />
                <div className="h-2.5 w-52 bg-muted/30 rounded animate-pulse" />
              </div>
              <div className="hidden md:block h-5 w-14 bg-muted/30 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-muted/30 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : showEmptyAll ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Start by adding your first customer, or share your booking page to collect them automatically."
          action={
            <Link href="/dashboard/clients/new" className={dashboardPrimaryActionClass}>
              <Icon name="plus" className="text-xs" /> Add your first customer
            </Link>
          }
        />
      ) : showEmptyFiltered ? (
        <EmptyState
          title="No matches found"
          description="Try adjusting your search or stage filter."
          action={
            <button type="button" onClick={clearFilters} className={dashboardOutlineActionClass}>
              <Icon name="x-lg" className="text-xs" /> Clear filters
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          {/* Header row (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_190px_140px_130px_72px] gap-4 px-5 py-2.5 border-b bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <div>Customer</div>
            <div>Contact</div>
            <div>Source</div>
            <div>Stage</div>
            <div />
          </div>

          <div className="divide-y">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}`}
                className="group grid grid-cols-1 md:grid-cols-[1fr_190px_140px_130px_72px] gap-y-1 md:gap-4 items-center px-5 py-3.5 hover:bg-muted/[0.07] transition-colors"
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold shrink-0 ${avatarColor(c.id)}`}
                    aria-hidden="true"
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </p>
                    {/* Mobile: stage badge + phone inline */}
                    <div className="flex items-center gap-2 md:hidden mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${STAGE_STYLES[c.stage]}`}
                      >
                        <span className={`w-1 h-1 rounded-full shrink-0 ${STAGE_DOT[c.stage]}`} />
                        {c.stage}
                      </span>
                      <span className="text-xs text-muted-foreground truncate tabular-nums">
                        {c.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact (desktop) */}
                <div className="hidden md:flex flex-col justify-center min-w-0 gap-0.5">
                  <span className="text-sm text-foreground/80 flex items-center gap-1.5 truncate">
                    <Icon name="telephone" className="shrink-0 text-muted-foreground/50" />
                    <span className="truncate tabular-nums">{c.phone}</span>
                  </span>
                  {c.email && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                      <Icon name="envelope" className="shrink-0 text-muted-foreground/50" />
                      <span className="truncate">{c.email}</span>
                    </span>
                  )}
                </div>

                {/* Source (desktop) */}
                <div className="hidden md:block text-sm truncate">
                  {c.source ? (
                    <span className="text-muted-foreground capitalize">
                      {c.source.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </div>

                {/* Stage (desktop) */}
                <div className="hidden md:flex items-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STAGE_STYLES[c.stage]}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STAGE_DOT[c.stage]}`} />
                    {c.stage}
                  </span>
                </div>

                {/* Action */}
                <div className="hidden md:flex justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/50 group-hover:text-primary transition-colors">
                    View
                    <Icon name="arrow-right" className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-5 py-2.5 border-t bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {clients.length}
              </span>{" "}
              {clients.length === 1 ? "customer" : "customers"}
            </span>
            {(q || stage) && (
              <button
                onClick={clearFilters}
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Icon name="x-lg" /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
