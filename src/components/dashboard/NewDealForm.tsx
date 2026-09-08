"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@heroui/react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardCheckbox, DashboardSelect, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { submitResource } from "@/lib/dashboard/use-resource";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import {
  dashboardErrorAlertClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { formatLkr } from "@/lib/utils";

type ServiceOption = { id: string; name: string; priceLkr: number };
type StaffOption = { id: string; name: string };
type LocationOption = { id: string; name: string; isDefault: boolean };

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NewDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifyResult, setNotifyResult] = useState<number | null>(null);

  const [form, setForm] = useState({
    serviceId: searchParams.get("serviceId") ?? "",
    staffId: searchParams.get("staffId") ?? "",
    locationId: searchParams.get("locationId") ?? "",
    discountPercent: Number(searchParams.get("discountPercent") ?? 20),
    slotsTotal: Number(searchParams.get("slotsTotal") ?? 3),
    dealWindowStart: "",
    dealWindowEnd: "",
    apptWindowStart: toLocalInputValue(searchParams.get("apptWindowStart")),
    apptWindowEnd: toLocalInputValue(searchParams.get("apptWindowEnd")),
    notifyClients: false,
  });

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setForm((prev) => ({
      ...prev,
      dealWindowStart: prev.dealWindowStart || toLocalInputValue(now.toISOString()),
      dealWindowEnd: prev.dealWindowEnd || toLocalInputValue(tomorrow.toISOString()),
    }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/services").then((r) => r.json()),
      fetch("/api/dashboard/staff").then((r) => r.json()),
      fetch("/api/dashboard/locations").then((r) => r.json()),
    ]).then(([serviceList, staffList, locationList]) => {
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setStaff(Array.isArray(staffList) ? staffList : []);
      setLocations(Array.isArray(locationList) ? locationList : []);
      const defaultLocation = (Array.isArray(locationList) ? locationList : []).find((l: LocationOption) => l.isDefault);
      setForm((prev) => ({
        ...prev,
        locationId: prev.locationId || defaultLocation?.id || "",
      }));
    }).catch(() => undefined);
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => service.id === form.serviceId),
    [services, form.serviceId],
  );

  const previewPrice = selectedService
    ? computeDiscountedPrice(selectedService.priceLkr, form.discountPercent)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitResource(
      "/api/dashboard/deals",
      {
        ...form,
        staffId: form.staffId || null,
        dealWindowStart: new Date(form.dealWindowStart).toISOString(),
        dealWindowEnd: new Date(form.dealWindowEnd).toISOString(),
        apptWindowStart: new Date(form.apptWindowStart).toISOString(),
        apptWindowEnd: new Date(form.apptWindowEnd).toISOString(),
      },
      "POST",
    );

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const data = result.data as { notified?: number };

    const suggestionId = searchParams.get("suggestionId");
    if (suggestionId) {
      await fetch(`/api/dashboard/deals/suggestions/${suggestionId}`, { method: "PATCH" }).catch(() => undefined);
    }

    if (data.notified && data.notified > 0) {
      setNotifyResult(data.notified);
      setLoading(false);
      return;
    }

    router.push("/dashboard/deals");
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="New deal"
        backHref="/dashboard/deals"
        backLabel="Deals"
      />
      <DashboardSection>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <DashboardSelect
          label="Service"
          isRequired
          value={form.serviceId}
          onChange={(value) => setForm((prev) => ({ ...prev, serviceId: value }))}
          options={[
            { value: "", label: "Select service" },
            ...services.map((service) => ({ value: service.id, label: `${service.name} (${formatLkr(service.priceLkr)})` })),
          ]}
        />

        <DashboardSelect
          label="Location"
          isRequired
          value={form.locationId}
          onChange={(value) => setForm((prev) => ({ ...prev, locationId: value }))}
          options={[
            { value: "", label: "Select location" },
            ...locations.map((location) => ({ value: location.id, label: location.name })),
          ]}
        />

        <DashboardSelect
          label="Staff (optional)"
          value={form.staffId}
          onChange={(value) => setForm((prev) => ({ ...prev, staffId: value }))}
          options={[
            { value: "", label: "Any available staff" },
            ...staff.map((member) => ({ value: member.id, label: member.name })),
          ]}
        />

        <Slider.Root
          value={form.discountPercent}
          onChange={(value) => setForm((prev) => ({ ...prev, discountPercent: value as number }))}
          minValue={10}
          maxValue={50}
          step={5}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Discount</span>
            <Slider.Output />
          </div>
          <Slider.Track className="mt-2">
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Root>

        <DashboardTextField
          label="Slots available"
          isRequired
          type="number"
          min={1}
          max={20}
          value={String(form.slotsTotal)}
          onChange={(value) => setForm((prev) => ({ ...prev, slotsTotal: Number(value) || 0 }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <DashboardTextField
            label="Deal starts"
            isRequired
            type="datetime-local"
            value={form.dealWindowStart}
            onChange={(value) => setForm((prev) => ({ ...prev, dealWindowStart: value }))}
          />
          <DashboardTextField
            label="Deal ends"
            isRequired
            type="datetime-local"
            value={form.dealWindowEnd}
            onChange={(value) => setForm((prev) => ({ ...prev, dealWindowEnd: value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DashboardTextField
            label="Appointment from"
            isRequired
            type="datetime-local"
            value={form.apptWindowStart}
            onChange={(value) => setForm((prev) => ({ ...prev, apptWindowStart: value }))}
          />
          <DashboardTextField
            label="Appointment until"
            isRequired
            type="datetime-local"
            value={form.apptWindowEnd}
            onChange={(value) => setForm((prev) => ({ ...prev, apptWindowEnd: value }))}
          />
        </div>

        {selectedService && previewPrice !== null && (
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            Clients pay <strong>{formatLkr(previewPrice)}</strong> instead of {formatLkr(selectedService.priceLkr)}.
          </div>
        )}

        <div className="rounded-lg border px-4 py-3">
          <DashboardCheckbox
            isSelected={form.notifyClients}
            onChange={(isSelected) => setForm((prev) => ({ ...prev, notifyClients: isSelected }))}
            label={
              <span>
                <span className="font-medium">Notify past clients (WhatsApp/SMS/email)</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Sends a one-time message to active clients who opted in. Requires Pro messaging.
                </span>
              </span>
            }
          />
        </div>

        {notifyResult !== null && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
            Deal published. Notified {notifyResult} past client{notifyResult === 1 ? "" : "s"}.
            <button
              type="button"
              onClick={() => router.push("/dashboard/deals")}
              className="ml-2 font-medium underline"
            >
              View deals
            </button>
          </div>
        )}

        {error && <p className={dashboardErrorAlertClass}>{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={dashboardPrimaryActionClass}
          >
            {loading ? "Creating…" : "Publish deal"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/deals")}
            className={dashboardOutlineActionClass}
          >
            Cancel
          </button>
        </div>
      </form>
      </DashboardSection>
    </div>
  );
}
