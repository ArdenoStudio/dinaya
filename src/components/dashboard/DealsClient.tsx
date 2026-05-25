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
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  upcoming: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-500",
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

export function DealsClient({ initialDeals }: { initialDeals: DealRow[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function cancelDeal(id: string) {
    setCancellingId(id);
    const res = await fetch(`/api/dashboard/deals/${id}`, { method: "PATCH" });
    if (res.ok) {
      setDeals((prev) => prev.map((deal) => (
        deal.id === id ? { ...deal, status: "cancelled", displayStatus: "cancelled" } : deal
      )));
      router.refresh();
    }
    setCancellingId(null);
  }

  return (
    <div className="bg-white border rounded-xl divide-y">
      {deals.map((deal) => {
        const discounted = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);
        const canCancel = !["cancelled", "expired", "sold_out"].includes(deal.displayStatus);
        return (
          <div key={deal.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Claim window: {formatWindow(deal.dealWindowStart, deal.dealWindowEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Appointments: {formatWindow(deal.apptWindowStart, deal.apptWindowEnd)}
                  {deal.staffName ? ` · ${deal.staffName}` : ""} · {deal.locationName}
                </p>
              </div>
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
        );
      })}
    </div>
  );
}
