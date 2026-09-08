"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardCheckbox, DashboardSwitch, DashboardTextAreaField, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { submitResource } from "@/lib/dashboard/use-resource";
import {
  dashboardCardClass,
  dashboardErrorAlertClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string };
type LocationOption = { id: string; name: string };

type StaffForm = {
  name: string;
  bio: string;
  avatarUrl: string;
  isActive: boolean;
  serviceIds: string[];
  locationIds: string[];
};

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<StaffForm | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/staff/${id}`).then((r) => r.json()),
      fetch("/api/dashboard/services").then((r) => r.json()),
      fetch("/api/dashboard/locations").then((r) => r.json()),
    ]).then(([member, serviceList, locationList]) => {
      if (member.error) {
        setForm(null);
      } else {
        setForm({
          name: member.name ?? "",
          bio: member.bio ?? "",
          avatarUrl: member.avatarUrl ?? "",
          isActive: Boolean(member.isActive),
          serviceIds: member.serviceIds ?? [],
          locationIds: member.locationIds ?? [],
        });
      }
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setLocations(Array.isArray(locationList) ? locationList.map((l: LocationOption) => ({ id: l.id, name: l.name })) : []);
      setLoading(false);
    });
  }, [id]);

  function toggleService(serviceId: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        serviceIds: current.serviceIds.includes(serviceId)
          ? current.serviceIds.filter((item) => item !== serviceId)
          : [...current.serviceIds, serviceId],
      };
    });
  }

  function toggleLocation(locationId: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        locationIds: current.locationIds.includes(locationId)
          ? current.locationIds.filter((item) => item !== locationId)
          : [...current.locationIds, locationId],
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");

    const result = await submitResource(`/api/dashboard/staff/${id}`, {
      ...form,
      avatarUrl: form.avatarUrl || null,
      bio: form.bio || null,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/staff");
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/dashboard/staff/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not delete staff member.");
      setDeleting(false);
      return;
    }
    router.push("/dashboard/staff");
  }

  if (loading) return <p className={cn(dashboardPageClass, "text-sm text-muted-foreground")}>Loading...</p>;
  if (!form) {
    return (
      <div className={dashboardPageClass}>
        <div className={cn(dashboardCardClass, "max-w-xl p-6")}>
          <p className="text-sm text-muted-foreground">Staff member not found.</p>
          <Link href="/dashboard/staff" className="mt-4 inline-flex text-sm text-primary hover:underline">
            Back to staff
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Edit team member"
        backHref="/dashboard/staff"
        backLabel="Staff"
        actions={
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirmDeleteOpen(true)}
            className={cn(dashboardOutlineActionClass, "border-destructive/30 text-destructive hover:bg-destructive/5")}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        }
      />

      <ConfirmDialog
        title="Delete team member"
        description={`Delete ${form.name || "this team member"}? Their past bookings stay on record, but this cannot be undone and they'll no longer be selectable for new appointments.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
      />

      <form onSubmit={handleSave} className={cn(dashboardSectionClass, "max-w-xl space-y-5")}>
        <DashboardTextField
          label="Name"
          isRequired
          value={form.name}
          onChange={(value) => setForm((current) => current && { ...current, name: value })}
        />

        <DashboardTextAreaField
          label="Short bio"
          value={form.bio}
          onChange={(value) => setForm((current) => current && { ...current, bio: value })}
          rows={3}
        />

        <DashboardTextField
          label="Avatar URL"
          value={form.avatarUrl}
          onChange={(value) => setForm((current) => current && { ...current, avatarUrl: value })}
          placeholder="https://..."
        />

        <DashboardSwitch
          label="Active on public booking page"
          isSelected={form.isActive}
          onChange={(isSelected) => setForm((current) => current && { ...current, isActive: isSelected })}
        />

        <div>
          <p className={dashboardLabelClass}>Can perform</p>
          <div className="mt-2 space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services yet.</p>
            ) : (
              services.map((service) => (
                <DashboardCheckbox
                  key={service.id}
                  isSelected={form.serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                  label={service.name}
                />
              ))
            )}
          </div>
        </div>

        {locations.length > 1 && (
          <div>
            <p className={dashboardLabelClass}>Works at</p>
            <div className="mt-2 space-y-2">
              {locations.map((loc) => (
                <DashboardCheckbox
                  key={loc.id}
                  isSelected={form.locationIds.includes(loc.id)}
                  onChange={() => toggleLocation(loc.id)}
                  label={loc.name}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className={dashboardErrorAlertClass}>{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(dashboardPrimaryActionClass, "ml-auto")}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
