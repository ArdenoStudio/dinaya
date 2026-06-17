"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatLkr } from "@/lib/utils";
import { computeDiscountedPrice } from "@/lib/deals/pricing";

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

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  upcoming: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
  cancelled: "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400",
  sold_out: "bg-amber-100 text-amber-700",
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ dealWindowEnd: "", apptWindowEnd: "", slotsTotal: 0 });
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function cancelDeal(id: string) {
    setCancellingId(id);
    const res = await fetch(`/api/dashboard/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      setDeals((prev) => prev.map((deal) => (
        deal.id === id ? { ...deal, status: "cancelled", displayStatus: "cancelled" } : deal
      )));
      router.refresh();
    }
    setCancellingId(null);
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

    const res = await fetch(`/api/dashboard/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealWindowEnd: new Date(editForm.dealWindowEnd).toISOString(),
        apptWindowEnd: new Date(editForm.apptWindowEnd).toISOString(),
        slotsTotal: editForm.slotsTotal,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setEditError(data.error ?? "Could not update deal.");
      setSavingId(null);
      return;
    }

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
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 divide-y">
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
                  <span className="text-xs font-semibold rounded-full bg-primary/10 text-primary px-2 py-0.5">
                    {deal.discountPercent}% OFF
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[deal.displayStatus] ?? STATUS_STYLES.expired}`}>
                    {deal.displayStatus.replace("_", " ")}
                  </span>
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
                    className="text-xs px-2.5 py-1 rounded border font-medium text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => cancelDeal(deal.id)}
                    disabled={cancellingId === deal.id}
                    className="text-xs px-2.5 py-1 rounded border font-medium text-muted-foreground hover:text-foreground hover:border-red-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs">
                    <span className="font-medium">Deal ends</span>
                    <input
                      type="datetime-local"
                      value={editForm.dealWindowEnd}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dealWindowEnd: e.target.value }))}
                      className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-medium">Appointment until</span>
                    <input
                      type="datetime-local"
                      value={editForm.apptWindowEnd}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, apptWindowEnd: e.target.value }))}
                      className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="font-medium">Total slots</span>
                    <input
                      type="number"
                      min={deal.slotsRedeemed}
                      max={20}
                      value={editForm.slotsTotal}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, slotsTotal: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>
                {editError && <p className="text-xs text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(deal.id)}
                    disabled={savingId === deal.id}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {savingId === deal.id ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border px-3 py-1.5 text-xs"
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
