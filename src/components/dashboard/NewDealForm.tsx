"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
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

    const res = await fetch("/api/dashboard/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        staffId: form.staffId || null,
        dealWindowStart: new Date(form.dealWindowStart).toISOString(),
        dealWindowEnd: new Date(form.dealWindowEnd).toISOString(),
        apptWindowStart: new Date(form.apptWindowStart).toISOString(),
        apptWindowEnd: new Date(form.apptWindowEnd).toISOString(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create deal.");
      setLoading(false);
      return;
    }

    const suggestionId = searchParams.get("suggestionId");
    if (suggestionId) {
      await fetch(`/api/dashboard/deals/suggestions/${suggestionId}`, { method: "PATCH" }).catch(() => undefined);
    }

    if (data.notified > 0) {
      setNotifyResult(data.notified);
      setLoading(false);
      return;
    }

    router.push("/dashboard/deals");
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-cal text-2xl mb-6">New deal</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Service *</label>
          <select
            required
            value={form.serviceId}
            onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name} ({formatLkr(service.priceLkr)})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Location *</label>
          <select
            required
            value={form.locationId}
            onChange={(e) => setForm((prev) => ({ ...prev, locationId: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Staff (optional)</label>
          <select
            value={form.staffId}
            onChange={(e) => setForm((prev) => ({ ...prev, staffId: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Any available staff</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Discount: {form.discountPercent}%</label>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={form.discountPercent}
            onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))}
            className="mt-2 w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Slots available *</label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={form.slotsTotal}
            onChange={(e) => setForm((prev) => ({ ...prev, slotsTotal: Number(e.target.value) }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Deal starts *</label>
            <input
              type="datetime-local"
              required
              value={form.dealWindowStart}
              onChange={(e) => setForm((prev) => ({ ...prev, dealWindowStart: e.target.value }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Deal ends *</label>
            <input
              type="datetime-local"
              required
              value={form.dealWindowEnd}
              onChange={(e) => setForm((prev) => ({ ...prev, dealWindowEnd: e.target.value }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Appointment from *</label>
            <input
              type="datetime-local"
              required
              value={form.apptWindowStart}
              onChange={(e) => setForm((prev) => ({ ...prev, apptWindowStart: e.target.value }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Appointment until *</label>
            <input
              type="datetime-local"
              required
              value={form.apptWindowEnd}
              onChange={(e) => setForm((prev) => ({ ...prev, apptWindowEnd: e.target.value }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {selectedService && previewPrice !== null && (
          <div className="rounded-lg bg-gray-50 dark:bg-neutral-900/60 px-4 py-3 text-sm">
            Clients pay <strong>{formatLkr(previewPrice)}</strong> instead of {formatLkr(selectedService.priceLkr)}.
          </div>
        )}

        <label className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.notifyClients}
            onChange={(e) => setForm((prev) => ({ ...prev, notifyClients: e.target.checked }))}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Notify past clients (WhatsApp/SMS/email)</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Sends a one-time message to active clients who opted in. Requires Pro messaging.
            </span>
          </span>
        </label>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Creating…" : "Publish deal"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/deals")}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
