"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { buttonVariants } from "@/components/ui/button";
import { dashboardFilterPillClass } from "@/lib/dashboard-ui";
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
  lead: "bg-blue-50 dark:bg-blue-950/400",
  prospect: "bg-violet-500",
  active: "bg-emerald-50 dark:bg-emerald-950/400",
  churned: "bg-gray-400",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
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

  const statCards = [
    {
      label: "Total customers",
      value: stats.total,
      icon: "people",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      accent: "bg-primary",
    },
    {
      label: "Active",
      value: stats.active,
      icon: "person-check",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      accent: "bg-emerald-50 dark:bg-emerald-950/400",
    },
    {
      label: "Leads",
      value: stats.leads,
      icon: "person-plus",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      accent: "bg-blue-50 dark:bg-blue-950/400",
    },
    {
      label: "Prospects",
      value: stats.prospects,
      icon: "stars",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
      accent: "bg-violet-500",
    },
  ];

  const isFiltering = !loading && (q || stage);
  const showEmptyAll = !loading && allClients.length === 0 && !isFiltering;
  const showEmptyFiltered = !loading && clients.length === 0 && isFiltering;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-cal text-3xl tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your customer list, track leads, and grow your business.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={exportCsv}
            disabled={clients.length === 0}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <Icon name="download" className="text-xs" /> Export CSV
          </button>
          <Link href="/dashboard/clients/new" className={cn(buttonVariants())}>
            <Icon name="plus" className="text-xs" /> Add customer
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div className={`h-[3px] w-full ${s.accent}`} />
            <div className="p-4 flex items-start gap-3">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${s.iconBg}`}
              >
                <Icon name={s.icon} className={`text-sm ${s.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {s.label}
                </p>
                {loading && !allClients.length ? (
                  <div className="h-7 w-10 bg-muted/40 rounded animate-pulse mt-1.5" />
                ) : (
                  <p className="text-2xl font-bold mt-0.5 tracking-tight tabular-nums">
                    {s.value}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
        <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="people" className="text-[1.15rem] text-primary" />
          </div>
          <h3 className="font-semibold text-base mb-1">No customers yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Start by adding your first customer, or share your booking page to collect them automatically.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-1.5 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-sm hover:shadow-md hover:shadow-primary/30 transition-all"
          >
            <Icon name="plus" className="text-xs" /> Add your first customer
          </Link>
        </div>
      ) : showEmptyFiltered ? (
        <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Icon name="search" className="text-[1.15rem] text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-base mb-1">No matches found</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Try adjusting your search or stage filter.
          </p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:border-gray-300 dark:border-neutral-700 hover:text-foreground transition-colors"
          >
            <Icon name="x-lg" className="text-xs" /> Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
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
