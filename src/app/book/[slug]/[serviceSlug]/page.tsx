import BookingPageContent from "@/components/booking/BookingPageContent";
import { loadBookingPageData } from "@/lib/booking/load-page-data";

interface Props {
  params: Promise<{ slug: string; serviceSlug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, serviceSlug } = await params;
  const data = await loadBookingPageData(slug, serviceSlug);
  if (data.status !== "ok" || !data.initialService) {
    return {};
  }
  return {
    title: `Book ${data.initialService.name} — ${data.business.name}`,
    description: data.initialService.description ?? `Book ${data.initialService.name} with ${data.business.name}`,
  };
}

export default async function ServiceBookingPage({ params, searchParams }: Props) {
  const { slug, serviceSlug } = await params;
  const { dealId } = await searchParams;
  const data = await loadBookingPageData(slug, serviceSlug);

  if (data.status === "suspended" || data.status === "offline") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="font-cal text-2xl tracking-tight">{data.business.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Online booking is temporarily unavailable for this business.
          </p>
        </div>
      </main>
    );
  }

  return (
    <BookingPageContent
      data={data}
      dealId={dealId}
      mode="service"
      serviceSlug={serviceSlug}
    />
  );
}
