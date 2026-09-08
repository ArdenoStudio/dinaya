"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { submitResource } from "@/lib/dashboard/use-resource";
import {
  dashboardCardClass,
  dashboardOutlineActionClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { formatLkr, cn } from "@/lib/utils";

type DealDisplayStatus = "active" | "upcoming" | "expired" | "cancelled" | "sold_out";

type DealRow = {
  id: string;
  serviceName: string;
  servicePriceLkr: number;
  staffName: string | null;
  locationName: string;
  discountPercent: number;
  slotsTotal: number;
  slotsRedeemed: number;
  dealWindowStart: string | Date;
  dealWindowEnd: string | Date;
  apptWindowStart: string | Date;
  apptWindowEnd: string | Date;
  status: string;
  displayStatus: DealDisplayStatus;
  impressionCount: number;
};

function formatWindow(start: string | Date, end: string | Date): string {
  const fmt = new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function toLocalInputValue(value: string | Date): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function conversionLabel(deal: DealRow): string | null {
  if (deal.impressionCount <= 0) return null;
  const rate = Math.round((deal.slotsRedeemed / deal.impressionCount) * 100);
  return `${rate}% conversion · ${deal.impressionCount} views`;
}

export function DealsClient({ initialDeals }: { initialDeals: DealRow[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ dealWindowEnd: "", apptWindowEnd: "", slotsTotal: 0 });
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function cancelDeal(id: string) {
    setCancellingId(id);
    const result = await submitResource(`/api/dashboard/deals/${id}`, { status: "cancelled" });
    setCancellingId(null);
    if (!result.ok) {
      toast.danger("Could not cancel deal", { description: result.error });
      return;
    }
    setDeals((prev) => prev.map((deal) => (
      deal.id === id ? { ...deal, status: "cancelled", displayStatus: "cancelled" } : deal
    )));
    toast.success("Deal cancelled");
    router.refresh();
  }

  function startEdit(deal: DealRow) {
    setEditingId(deal.id);
    setEditError("");
    setEditForm({
      dealWindowEnd: toLocalInputValue(deal.dealWindowEnd),
      apptWindowEnd: toLocalInputValue(deal.apptWindowEnd),
      slotsTotal: deal.slotsTotal,
    });
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setEditError("");

    const result = await submitResource(`/api/dashboard/deals/${id}`, {
      dealWindowEnd: new Date(editForm.dealWindowEnd).toISOString(),
      apptWindowEnd: new Date(editForm.apptWindowEnd).toISOString(),
      slotsTotal: editForm.slotsTotal,
    });
    setSavingId(null);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    const data = result.data as { dealWindowEnd: string; apptWindowEnd: string; slotsTotal: number; status: string };
    setDeals((prev) => prev.map((deal) => (
      deal.id === id
        ? {
            ...deal,
            dealWindowEnd: data.dealWindowEnd,
            apptWindowEnd: data.apptWindowEnd,
            slotsTotal: data.slotsTotal,
            displayStatus: data.status === "active" ? "active" : deal.displayStatus,
            status: data.status,
          }
        : deal
    )));
    setEditingId(null);
    toast.success("Deal updated");
    router.refresh();
  }

  return (
    <div className={cn(dashboardCardClass, "divide-y overflow-hidden")}>
      {deals.map((deal) => {
        const discounted = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);
        const canCancel = !["cancelled", "expired", "sold_out"].includes(deal.displayStatus);
        const canEdit = !["cancelled", "expired"].includes(deal.displayStatus);
        const conversion = conversionLabel(deal);
        const isEditing = editingId === deal.id;

        return (
          <div key={deal.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{deal.serviceName}</p>
                  <span className="text-xs font-semibold rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {deal.discountPercent}% OFF
                  </span>
                  <StatusBadge status={deal.displayStatus} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatLkr(deal.servicePriceLkr)} → {formatLkr(discounted)} · {deal.slotsRedeemed}/{deal.slotsTotal} redeemed
                </p>
                {conversion && (
                  <p className="text-xs text-muted-foreground mt-1">{conversion}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Claim window: {formatWindow(deal.dealWindowStart, deal.dealWindowEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Appointments: {formatWindow(deal.apptWindowStart, deal.apptWindowEnd)}
                  {deal.staffName ? ` · ${deal.staffName}` : ""} · {deal.locationName}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(deal)}
                    className={dashboardOutlineActionClass}
                  >
                    Edit
                  </button>
                )}
                {canCancel && (
                  <>
                    <button
                      type="button"
                      disabled={cancellingId === deal.id}
                      onClick={() => setConfirmCancelId(deal.id)}
                      className={cn(dashboardOutlineActionClass, "text-xs disabled:opacity-50")}
                    >
                      {cancellingId === deal.id ? "Cancelling…" : "Cancel"}
                    </button>
                    <ConfirmDialog
                      title="Cancel deal"
                      description={`Cancel "${deal.serviceName}" (${deal.discountPercent}% off)? Clients will no longer be able to claim it.`}
                      confirmLabel="Cancel deal"
                      variant="destructive"
                      onConfirm={() => cancelDeal(deal.id)}
                      open={confirmCancelId === deal.id}
                      onOpenChange={(open) => setConfirmCancelId(open ? deal.id : null)}
                    />
                  </>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DashboardTextField
                    label="Deal ends"
                    type="datetime-local"
                    value={editForm.dealWindowEnd}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, dealWindowEnd: value }))}
                  />
                  <DashboardTextField
                    label="Appointment until"
                    type="datetime-local"
                    value={editForm.apptWindowEnd}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, apptWindowEnd: value }))}
                  />
                  <DashboardTextField
                    label="Total slots"
                    type="number"
                    min={deal.slotsRedeemed}
                    max={20}
                    value={String(editForm.slotsTotal)}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, slotsTotal: Number(value) }))}
                  />
                </div>
                {editError && <p className="text-xs text-destructive">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(deal.id)}
                    disabled={savingId === deal.id}
                    className={dashboardPrimaryActionClass}
                  >
                    {savingId === deal.id ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className={dashboardOutlineActionClass}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
