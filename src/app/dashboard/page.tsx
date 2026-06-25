import { notFound } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { requireBusiness } from "@/lib/auth";
import { getDashboardOverviewData } from "@/lib/dashboard/overview-data";

export default async function DashboardOverviewPage() {
  const { businessId } = await requireBusiness();
  const data = await getDashboardOverviewData(businessId);

  if (!data) notFound();

  return <DashboardOverview data={data} />;
}
