"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSelect, DashboardSwitch, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_ROUTER_OPTIONS, type BookingRouter, type BookingRouterOption } from "@/lib/booking-router";
import {
  dashboardErrorAlertClass,
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
          <DashboardSwitch
            label="Show the router on my booking page"
            isSelected={router.enabled}
            onChange={(enabled) => setRouter((r) => ({ ...r, enabled }))}
          />

          <DashboardTextField
            label="Question"
            value={router.question}
            onChange={(question) => setRouter((r) => ({ ...r, question }))}
            placeholder="What brings you in today?"
          />

          <div className="space-y-2">
            <p className={dashboardLabelClass}>Answers</p>
            {router.options.map((o, index) => (
              <div key={o.id} className="flex items-center gap-2">
                <DashboardTextField
                  label="Answer"
                  hideLabel
                  className="flex-1"
                  value={o.label}
                  onChange={(label) => setOption(index, { label })}
                  placeholder="Answer (e.g. Routine cleaning)"
                />
                <span className="text-muted-foreground text-xs shrink-0">→</span>
                <DashboardSelect
                  label="Service"
                  hideLabel
                  className="max-w-[40%] shrink-0"
                  value={o.serviceId}
                  onChange={(serviceId) => setOption(index, { serviceId })}
                  options={services.map((s) => ({ value: s.id, label: s.isActive ? s.name : `${s.name} (hidden)` }))}
                />
                <button type="button" aria-label="Remove answer" onClick={() => removeOption(index)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <X className="size-3.5" />
                </button>
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
              <span className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="size-4" /> Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
