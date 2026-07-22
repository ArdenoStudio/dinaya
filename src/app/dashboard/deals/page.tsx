import Link from "next/link";
import { ProGate } from "@/components/ProGate";
import { requireOwner } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDealsDashboardList } from "@/lib/dashboard/deals";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DealsClient } from "@/components/dashboard/DealsClient";
import { DealSuggestionsCard } from "@/components/dashboard/DealSuggestionsCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
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
      <div className={dashboardPageClass}>
        <DashboardPageHeader
          title="Dinaya Deals"
          description="Post flash discounts on slow slots. Clients discover deals on Dinaya and book at the discounted price."
          actions={
            <Link href="/dashboard/deals/new" className={dashboardPrimaryActionClass}>
              <Icon name="plus" className="text-xs" /> New deal
            </Link>
          }
        />

        {!business?.directoryListed && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
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
              <Link href="/dashboard/deals/new" className={dashboardPrimaryActionClass}>
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
