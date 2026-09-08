"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardCheckbox, DashboardTextAreaField, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { submitResource } from "@/lib/dashboard/use-resource";
import {
  dashboardErrorAlertClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

interface Service { id: string; name: string; }
interface LocationOption { id: string; name: string; }

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", bio: "" });
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/services").then((r) => r.json()),
      fetch("/api/dashboard/locations").then((r) => r.json()),
    ]).then(([serviceList, locationList]) => {
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setLocations(Array.isArray(locationList) ? locationList.map((l: LocationOption) => ({ id: l.id, name: l.name })) : []);
    });
  }, []);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitResource(
      "/api/dashboard/staff",
      { ...form, serviceIds: selectedServices, locationIds: selectedLocations },
      "POST",
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/staff");
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="New team member"
        backHref="/dashboard/staff"
        backLabel="Staff"
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
        <DashboardTextField
          label="Name"
          isRequired
          value={form.name}
          onChange={(value) => setForm((f) => ({ ...f, name: value }))}
          placeholder="Kamala Silva"
        />
        <DashboardTextAreaField
          label="Short bio"
          value={form.bio}
          onChange={(value) => setForm((f) => ({ ...f, bio: value }))}
          rows={2}
          placeholder="5 years experience in…"
        />
        {services.length > 0 && (
          <div>
            <label className={dashboardLabelClass}>Can perform</label>
            <div className="mt-2 space-y-1">
              {services.map((s) => (
                <DashboardCheckbox
                  key={s.id}
                  isSelected={selectedServices.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  label={s.name}
                />
              ))}
            </div>
          </div>
        )}

        {locations.length > 1 && (
          <div>
            <label className={dashboardLabelClass}>Works at</label>
            <div className="mt-2 space-y-1">
              {locations.map((loc) => (
                <DashboardCheckbox
                  key={loc.id}
                  isSelected={selectedLocations.includes(loc.id)}
                  onChange={() =>
                    setSelectedLocations((prev) =>
                      prev.includes(loc.id) ? prev.filter((id) => id !== loc.id) : [...prev, loc.id],
                    )
                  }
                  label={loc.name}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className={dashboardErrorAlertClass}>{error}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={cn(dashboardPrimaryActionClass, "ml-auto")}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
