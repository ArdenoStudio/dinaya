"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_ROUTER_OPTIONS, type BookingRouter, type BookingRouterOption } from "@/lib/booking-router";
import {
  dashboardErrorAlertClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

interface ServiceOption {
  id: string;
  name: string;
  isActive: boolean;
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `o_${Math.round(performance.now() * 1000)}`;
}

export default function BookingRouterPage() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [router, setRouter] = useState<BookingRouter>({ enabled: false, question: "", options: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/booking-router")
      .then((r) => r.json())
      .then((data: { router: BookingRouter | null; services: ServiceOption[] }) => {
        setServices(Array.isArray(data.services) ? data.services : []);
        if (data.router) setRouter(data.router);
        setLoading(false);
      });
  }, []);

  function setOption(index: number, patch: Partial<BookingRouterOption>) {
    setRouter((r) => ({ ...r, options: r.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) }));
  }
  function addOption() {
    setRouter((r) =>
      r.options.length >= MAX_ROUTER_OPTIONS
        ? r
        : { ...r, options: [...r.options, { id: newId(), label: "", serviceId: services[0]?.id ?? "" }] },
    );
  }
  function removeOption(index: number) {
    setRouter((r) => ({ ...r, options: r.options.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/dashboard/booking-router", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(router),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Booking router"
        backHref="/dashboard/services"
        backLabel="Services"
        description={
          <>
            Ask one question first on your booking page and send each answer to the right service
            (e.g. &ldquo;Routine cleaning&rdquo; vs &ldquo;Tooth pain&rdquo;).{" "}
            <span className="font-medium">Pro plan.</span>
          </>
        }
      />

      {loading ? (
        <div className="max-w-lg space-y-4 rounded-3xl border border-black/6 bg-card p-5 dark:border-white/8">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className={cn(dashboardSurfaceClass, "max-w-lg p-6 text-sm text-muted-foreground")}>
          Add at least one service first, then come back to set up routing.
        </div>
      ) : (
        <div className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={router.enabled}
              onChange={(e) => setRouter((r) => ({ ...r, enabled: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium">Show the router on my booking page</span>
          </label>

          <div>
            <label className={dashboardLabelClass}>Question</label>
            <input value={router.question}
              onChange={(e) => setRouter((r) => ({ ...r, question: e.target.value }))}
              placeholder="What brings you in today?" className={dashboardInputClass} />
          </div>

          <div className="space-y-2">
            <p className={dashboardLabelClass}>Answers</p>
            {router.options.map((o, index) => (
              <div key={o.id} className="flex items-center gap-2">
                <input value={o.label} onChange={(e) => setOption(index, { label: e.target.value })}
                  placeholder="Answer (e.g. Routine cleaning)" className={dashboardInputClass} />
                <span className="text-muted-foreground text-xs shrink-0">→</span>
                <select value={o.serviceId} onChange={(e) => setOption(index, { serviceId: e.target.value })}
                  className={cn(dashboardInputClass, "max-w-[40%]")}>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.isActive ? "" : " (hidden)"}</option>
                  ))}
                </select>
                <button type="button" aria-label="Remove answer" onClick={() => removeOption(index)}
                  className="shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive">✕</button>
              </div>
            ))}
            {router.options.length < MAX_ROUTER_OPTIONS && (
              <button type="button" onClick={addOption} className="text-sm text-primary hover:underline">
                + Add an answer
              </button>
            )}
          </div>

          {error && <p className={dashboardErrorAlertClass}>{error}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={save} disabled={saving} className={dashboardPrimaryActionClass}>
              {saving ? "Saving…" : "Save router"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm">
                <CheckCircle className="size-4" /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
