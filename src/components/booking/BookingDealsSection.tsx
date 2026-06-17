"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { trackDealImpression } from "@/lib/analytics/gtag";
import { markDealImpression } from "@/lib/deals/impressions-client";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { formatLkr } from "@/lib/utils";
import type { DealListItem } from "@/lib/deals/queries";

type Props = {
  deals: DealListItem[];
  selectedDealId: string | null;
  onSelectDeal: (deal: DealListItem | null) => void;
};

function BookingDealRow({
  deal,
  selected,
  onSelectDeal,
}: {
  deal: DealListItem;
  selected: boolean;
  onSelectDeal: (deal: DealListItem | null) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const discounted = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            trackDealImpression({
              dealId: deal.id,
              businessSlug: deal.businessSlug,
              discountPercent: deal.discountPercent,
              city: deal.directoryCity,
              category: deal.directoryCategory,
            });
            markDealImpression(deal.id);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [deal]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelectDeal(selected ? null : deal)}
      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        selected ? "border-primary bg-white dark:bg-neutral-900" : "border-transparent bg-white/70 dark:bg-neutral-900/70 hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{deal.serviceName}</span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          {deal.discountPercent}% OFF
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatLkr(deal.servicePriceLkr)} → {formatLkr(discounted)} · {deal.slotsRemaining} left ·{" "}
        {format(deal.apptWindowStart, "EEE h:mm a")} – {format(deal.apptWindowEnd, "h:mm a")}
      </p>
    </button>
  );
}

export function BookingDealsSection({ deals, selectedDealId, onSelectDeal }: Props) {
  if (deals.length === 0) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 md:mx-8 md:mb-6">
      <p className="text-sm font-semibold text-primary">Deals available</p>
      <div className="mt-3 space-y-2">
        {deals.map((deal) => (
          <BookingDealRow
            key={deal.id}
            deal={deal}
            selected={selectedDealId === deal.id}
            onSelectDeal={onSelectDeal}
          />
        ))}
      </div>
    </div>
  );
}
