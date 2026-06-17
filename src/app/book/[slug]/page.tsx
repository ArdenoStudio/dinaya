import BookingPageContent from "@/components/booking/BookingPageContent";
import { loadBookingPageData } from "@/lib/booking/load-page-data";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await loadBookingPageData(slug);
  if (data.status !== "ok") {
    return { title: data.business.name };
  }
  return {
    title: `Book an appointment — ${data.business.name}`,
    description: data.business.description ?? `Book online with ${data.business.name}`,
  };
}

export default async function BookingHubPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { dealId } = await searchParams;
  const data = await loadBookingPageData(slug);

  if (data.status === "suspended" || data.status === "offline") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-900/60 px-6">
        <div className="max-w-md rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-8 text-center shadow-sm">
          <h1 className="font-cal text-2xl tracking-tight">{data.business.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Online booking is temporarily unavailable for this business.
          </p>
        </div>
      </main>
    );
  }

  return <BookingPageContent data={data} dealId={dealId} mode="hub" />;
}
