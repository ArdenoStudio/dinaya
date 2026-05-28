import Link from "next/link";
import { ProGate } from "@/components/ProGate";
import { requireOwner } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDealsDashboardList } from "@/lib/dashboard/deals";
import { DealsClient } from "@/components/dashboard/DealsClient";
import { DealSuggestionsCard } from "@/components/dashboard/DealSuggestionsCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "lucide-react";

export default async function DealsPage() {
  const { businessId } = await requireOwner();

  const [dealsData, [business]] = await Promise.all([
    getDealsDashboardList(businessId, { limit: 200 }),
    db
      .select({ directoryListed: businesses.directoryListed })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
  ]);

  const deals = dealsData.rows;

  return (
    <ProGate businessId={businessId} feature="deals">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-cal text-2xl">Dinaya Deals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Post flash discounts on slow slots. Clients discover deals on Dinaya and book at the discounted price.
            </p>
          </div>
          <Link
            href="/dashboard/deals/new"
            className="flex items-center gap-1.5 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium border-b-2 border-primary/70 shadow-sm"
          >
            <Icon name="plus" className="text-xs" /> New deal
          </Link>
        </div>

        {!business?.directoryListed && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            List your business in the Dinaya directory to appear on the public deals page.{" "}
            <Link href="/dashboard/marketing" className="font-medium underline">
              Update directory settings
            </Link>
          </div>
        )}

        <DealSuggestionsCard businessId={businessId} />

        {deals.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No deals yet"
            description="Create a time-limited discount to fill empty appointment slots."
            action={
              <Link
                href="/dashboard/deals/new"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Post your first deal
              </Link>
            }
          />
        ) : (
          <DealsClient initialDeals={deals} />
        )}
      </div>
    </ProGate>
  );
}
