"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { buildDealBookingUrl } from "@/lib/deals/urls";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import { trackDealClick, trackDealImpression } from "@/lib/analytics/gtag";
import { markDealImpression } from "@/lib/deals/impressions-client";
import type { DealListItem } from "@/lib/deals/queries";

type Props = {
  deals: DealListItem[];
  activeCity?: string | null;
  minDiscount?: number;
};

function DealCard({ deal, sourcePage }: { deal: DealListItem; sourcePage: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const discounted = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);
  const bookingUrl = buildDealBookingUrl(deal.businessSlug, deal.id);

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
    <div ref={ref} className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {deal.logoUrl ? (
          <Image
            src={deal.logoUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-xl object-cover image-depth"
            unoptimized={!isOptimizableRemoteImage(deal.logoUrl)}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            {deal.businessName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{deal.businessName}</p>
          <p className="text-sm text-muted-foreground truncate">{deal.serviceName}</p>
        </div>
        <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold tabular-nums text-primary-foreground">
          {deal.discountPercent}% OFF
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm tabular-nums">
            <span className="text-muted-foreground line-through">{formatLkr(deal.servicePriceLkr)}</span>{" "}
            <span className="font-semibold text-primary">{formatLkr(discounted)}</span>
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {deal.slotsRemaining} slot{deal.slotsRemaining === 1 ? "" : "s"} left ·{" "}
            {format(deal.apptWindowStart, "EEE h:mm a")} – {format(deal.apptWindowEnd, "h:mm a")}
          </p>
        </div>
        <Link
          href={bookingUrl}
          onClick={() => trackDealClick({
            dealId: deal.id,
            businessSlug: deal.businessSlug,
            discountPercent: deal.discountPercent,
            city: deal.directoryCity,
            category: deal.directoryCategory,
            sourcePage,
          })}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100"
        >
          Book deal
        </Link>
      </div>
    </div>
  );
}

export function DiscoverDeals({ deals, activeCity, minDiscount }: Props) {
  const filtered = deals.filter((deal) => {
    if (activeCity && deal.directoryCity !== activeCity) return false;
    if (minDiscount && deal.discountPercent < minDiscount) return false;
    return true;
  });

  if (filtered.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="font-cal text-2xl tracking-tight">Deals near you</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Limited-time discounts on open appointment slots.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((deal) => (
          <DealCard key={deal.id} deal={deal} sourcePage="discover" />
        ))}
      </div>
    </section>
  );
}
