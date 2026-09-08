"use client";

import { useRef, useState } from "react";
import { Modal, toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { DashboardTextField, DashboardCheckbox } from "@/components/dashboard/DashboardFormField";
import { Button } from "@/components/ui/button";
import { useResource, submitResource } from "@/lib/dashboard/use-resource";
import { dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { Webhook } from "lucide-react";

const ALL_EVENTS = [
  { value: "booking.created", label: "Booking created" },
  { value: "booking.confirmed", label: "Booking confirmed" },
  { value: "booking.rescheduled", label: "Booking rescheduled" },
  { value: "booking.cancelled", label: "Booking cancelled" },
  { value: "booking.completed", label: "Booking completed" },
  { value: "booking.no_show", label: "No-show marked" },
] as const;

type WebhookEvent = typeof ALL_EVENTS[number]["value"];

interface WebhookRow {
  id: string;
  url: string;
  hasSecret: boolean;
  secret?: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { url: "", events: ["booking.created"] as WebhookEvent[] };

export function WebhooksClient() {
  const { data, setData, loading } = useResource<WebhookRow[]>("/api/dashboard/webhooks");
  const hooks = data ?? [];
  const [adding, setAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  // DataTable caches a row's rendered cells by row identity, so this button's
  // `disabled` attribute (driven by pendingId, not row data) never visually
  // updates — guard re-entrancy here instead of relying on the DOM state.
  const pendingIdsRef = useRef<Set<string>>(new Set());

  function toggleEvent(event: WebhookEvent) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url || !form.events.length) return;
    setAdding(true);
    const result = await submitResource("/api/dashboard/webhooks", form, "POST");
    setAdding(false);
    if (!result.ok) {
      toast.danger("Could not add webhook", { description: result.error });
      return;
    }
    const hook = result.data as WebhookRow & { secret?: string };
    setData((prev) => [hook, ...(prev ?? [])]);
    setRevealedSecret(hook.secret ?? null);
    setModalOpen(false);
    setForm(emptyForm);
  }

  async function toggleActive(hook: WebhookRow) {
    if (pendingIdsRef.current.has(hook.id)) return;
    pendingIdsRef.current.add(hook.id);
    setPendingId(hook.id);
    const result = await submitResource(`/api/dashboard/webhooks/${hook.id}`, { isActive: !hook.isActive });
    pendingIdsRef.current.delete(hook.id);
    setPendingId(null);
    if (!result.ok) {
      toast.danger("Could not update webhook", { description: result.error });
      return;
    }
    setData((prev) => (prev ?? []).map((h) => (h.id === hook.id ? (result.data as WebhookRow) : h)));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dashboard/webhooks/${id}`, { method: "DELETE" });
    setData((prev) => (prev ?? []).filter((h) => h.id !== id));
    toast.success("Webhook deleted");
  }

  const columns: DataTableColumn<WebhookRow>[] = [
    {
      key: "url",
      header: "Endpoint",
      render: (hook) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{hook.url}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {hook.events.map((ev) => (
              <span key={ev} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {ev}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (hook) => (
        <button
          type="button"
          disabled={pendingId === hook.id}
          onClick={() => void toggleActive(hook)}
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground disabled:opacity-50"
        >
          {hook.isActive ? "Active" : "Paused"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (hook) => (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmDeleteId(hook.id)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className={cn(dashboardPageClass, "max-w-2xl")}>
      <DashboardPageHeader
        title="Webhooks"
        description="Get notified at a URL when booking events happen. Verified with an HMAC-SHA256 signature."
        backHref="/dashboard/settings/integrations"
        backLabel="Integrations"
        actions={
          <button onClick={() => setModalOpen(true)} className={dashboardPrimaryActionClass}>
            + Add webhook
          </button>
        }
      />

      {revealedSecret && (
        <DashboardSection muted>
          <p className="mb-1 text-sm font-medium">Save your signing secret — it won&apos;t be shown again.</p>
          <code className="break-all rounded bg-muted px-2 py-1 text-xs">{revealedSecret}</code>
          <button onClick={() => setRevealedSecret(null)} className="ml-3 text-xs text-primary hover:underline">
            Dismiss
          </button>
        </DashboardSection>
      )}

      {loading ? (
        <DashboardLoadingPanel rows={2} />
      ) : hooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Add a webhook endpoint to receive booking events at your server."
          action={
            <button type="button" onClick={() => setModalOpen(true)} className={dashboardPrimaryActionClass}>
              Add webhook
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={hooks} getRowId={(h) => h.id} />
      )}

      {/* Hoisted outside the table: react-aria's Table caches each row's rendered
          cells keyed by row identity, so a dialog mounted inside a column's render
          never re-renders on state that isn't part of the row data — it would stay
          permanently closed. */}
      <ConfirmDialog
        title="Delete webhook"
        description="Delete this webhook? Your server will stop receiving events."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteId) return handleDelete(confirmDeleteId);
        }}
        open={confirmDeleteId !== null}
        onOpenChange={(open) => setConfirmDeleteId(open ? confirmDeleteId : null)}
      />

      <Modal.Root
        isOpen={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setForm(emptyForm);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Add webhook</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleAdd}>
                <Modal.Body className="space-y-4">
                  <DashboardTextField
                    label="Endpoint URL"
                    isRequired
                    type="url"
                    value={form.url}
                    onChange={(value) => setForm((f) => ({ ...f, url: value }))}
                    placeholder="https://your-server.com/webhooks/dinaya"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Events to send</p>
                    <div className="mt-2 space-y-2">
                      {ALL_EVENTS.map((ev) => (
                        <DashboardCheckbox
                          key={ev.value}
                          isSelected={form.events.includes(ev.value)}
                          onChange={() => toggleEvent(ev.value)}
                          label={
                            <span className="text-sm">
                              {ev.label} <code className="text-xs text-muted-foreground">{ev.value}</code>
                            </span>
                          }
                        />
                      ))}
                    </div>
                  </div>
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
                  <Button
                    type="submit"
                    disabled={adding || !form.events.length}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    {adding ? "Adding…" : "Add webhook"}
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
