"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { toast, Modal } from "@heroui/react";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { Button } from "@/components/ui/button";
import { useResource, submitResource } from "@/lib/dashboard/use-resource";
import { dashboardOutlineActionClass, dashboardPrimaryActionClass, dashboardErrorAlertClass, dashboardPageClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type LocationRow = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  staffCount: number;
};

type Props = {
  plan: string;
  locationLimit: number | null;
};

const emptyForm = { name: "", address: "", phone: "" };

export default function LocationsClient({ plan, locationLimit }: Props) {
  const { data, setData, loading } = useResource<LocationRow[]>("/api/dashboard/locations");
  const locations = data ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // DataTable caches a row's rendered cells by row identity, so this button's
  // `disabled` attribute (driven by pendingId, not row data) never visually
  // updates — guard re-entrancy here instead of relying on the DOM state.
  const pendingIdsRef = useRef<Set<string>>(new Set());

  async function reload() {
    const res = await fetch("/api/dashboard/locations");
    const json = await res.json();
    if (res.ok) setData(Array.isArray(json) ? json : []);
  }

  const atLimit = locationLimit !== null && locations.length >= locationLimit;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const result = await submitResource(
      "/api/dashboard/locations",
      { name: form.name, address: form.address || null, phone: form.phone || null },
      "POST",
    );
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setForm(emptyForm);
    setModalOpen(false);
    toast.success("Location added");
    await reload();
  }

  async function setDefault(id: string) {
    if (pendingIdsRef.current.has(id)) return;
    pendingIdsRef.current.add(id);
    setPendingId(id);
    const result = await submitResource(`/api/dashboard/locations/${id}`, { isDefault: true });
    pendingIdsRef.current.delete(id);
    setPendingId(null);
    if (!result.ok) {
      toast.danger("Could not set default location", { description: result.error });
      return;
    }
    await reload();
  }

  async function toggleActive(id: string, isActive: boolean) {
    if (pendingIdsRef.current.has(id)) return;
    pendingIdsRef.current.add(id);
    setPendingId(id);
    const result = await submitResource(`/api/dashboard/locations/${id}`, { isActive: !isActive });
    pendingIdsRef.current.delete(id);
    setPendingId(null);
    if (!result.ok) {
      toast.danger("Could not update location", { description: result.error });
      return;
    }
    await reload();
  }

  const columns: DataTableColumn<LocationRow>[] = [
    {
      key: "name",
      header: "Location",
      render: (loc) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{loc.name}</span>
            {loc.isDefault ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Default
              </span>
            ) : null}
            {!loc.isActive ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                Inactive
              </span>
            ) : null}
          </div>
          {loc.address ? <p className="mt-0.5 text-xs text-muted-foreground">{loc.address}</p> : null}
        </div>
      ),
    },
    {
      key: "staff",
      header: "Staff",
      render: (loc) => <span className="text-muted-foreground">{loc.staffCount} staff</span>,
    },
    {
      key: "timezone",
      header: "Timezone",
      className: "text-muted-foreground",
      render: (loc) => loc.timezone,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (loc) => (
        <div className="flex flex-wrap justify-end gap-2">
          {!loc.isDefault ? (
            <button
              type="button"
              disabled={pendingId === loc.id}
              onClick={() => void setDefault(loc.id)}
              className={cn(dashboardOutlineActionClass, "px-2.5 py-1 text-xs disabled:opacity-50")}
            >
              Set default
            </button>
          ) : null}
          <button
            type="button"
            disabled={pendingId === loc.id}
            onClick={() => void toggleActive(loc.id, loc.isActive)}
            className={cn(dashboardOutlineActionClass, "px-2.5 py-1 text-xs disabled:opacity-50")}
          >
            {loc.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Locations"
        description={
          <>
            Manage branches for your booking page and dashboard.
            {locationLimit !== null && (
              <span className="ml-1">
                ({locations.length}/{locationLimit} on {plan} plan)
              </span>
            )}
          </>
        }
        actions={
          !atLimit ? (
            <button type="button" onClick={() => setModalOpen(true)} className={dashboardPrimaryActionClass}>
              <Plus className="size-3.5" /> Add location
            </button>
          ) : undefined
        }
      />

      {atLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
          You&apos;ve reached your plan limit of {locationLimit} location{locationLimit === 1 ? "" : "s"}.{" "}
          <Link href="/dashboard/billing" className="font-medium underline">
            Upgrade
          </Link>{" "}
          to add more branches.
        </div>
      )}

      {loading ? (
        <DashboardLoadingPanel rows={2} />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first branch so clients can pick where to book."
          action={
            <button type="button" onClick={() => setModalOpen(true)} className={dashboardPrimaryActionClass}>
              <Plus className="size-3.5" /> Add location
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={locations} getRowId={(loc) => loc.id} />
      )}

      <Modal.Root
        isOpen={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setForm(emptyForm);
            setFormError("");
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>New branch</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleCreate}>
                <Modal.Body className="space-y-4">
                  <DashboardTextField
                    label="Name"
                    isRequired
                    value={form.name}
                    onChange={(value) => setForm((f) => ({ ...f, name: value }))}
                    placeholder="Colombo 7 branch"
                  />
                  <DashboardTextField
                    label="Address"
                    value={form.address}
                    onChange={(value) => setForm((f) => ({ ...f, address: value }))}
                  />
                  <DashboardTextField
                    label="Phone"
                    value={form.phone}
                    onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
                  />
                  {formError ? <p className={dashboardErrorAlertClass}>{formError}</p> : null}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full sm:w-auto"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="min-h-11 w-full sm:w-auto">
                    {saving ? "Saving…" : "Create"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}
