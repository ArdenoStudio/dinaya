import { ProGate } from "@/components/ProGate";
import { requireOwner } from "@/lib/auth";
import { getPaymentsDashboardList } from "@/lib/dashboard/payments";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { PaymentsTable } from "@/components/dashboard/PaymentsTable";
import { dashboardOutlineActionClass, dashboardPageClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { businessId } = await requireOwner();
  const { cursor: cursorParam } = await searchParams;
  const cursor = cursorParam ? new Date(cursorParam) : null;
  const { rows, hasMore, nextCursor } = await getPaymentsDashboardList(businessId, {
    limit: 100,
    cursor: cursor && !Number.isNaN(cursor.getTime()) ? cursor : null,
  });

  return (
    <ProGate businessId={businessId} feature="payments">
      <div className={dashboardPageClass}>
        <DashboardPageHeader
          title="Payments"
          description="PayHere payment attempts and collected revenue."
          actions={
            <Link href="/dashboard/settings" className={dashboardPrimaryActionClass}>
              PayHere setup
            </Link>
          }
        />

        <PaymentsTable rows={rows} />

        {hasMore && nextCursor ? (
          <div className="flex justify-center pt-2">
            <Link
              href={`/dashboard/payments?cursor=${encodeURIComponent(nextCursor)}`}
              className={dashboardOutlineActionClass}
            >
              Next page →
            </Link>
          </div>
        ) : null}
      </div>
    </ProGate>
  );
}
