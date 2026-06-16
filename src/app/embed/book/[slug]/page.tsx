import BookingPageContent from "@/components/booking/BookingPageContent";
import { loadBookingPageData } from "@/lib/booking/load-page-data";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    dealId?: string;
    service?: string;
    name?: string;
    email?: string;
    phone?: string;
    hideGallery?: string;
  }>;
}

export default async function EmbedBookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { dealId, service: serviceSlug, hideGallery: hideGalleryParam } = await searchParams;
  const hideGallery = hideGalleryParam === "1" || hideGalleryParam === "true";
  const data = await loadBookingPageData(slug, serviceSlug);

  if (data.status !== "ok") {
    return (
      <main className="flex min-h-[480px] items-center justify-center bg-gray-50 px-6">
        <p className="text-sm text-muted-foreground">Booking unavailable.</p>
      </main>
    );
  }

  return (
    <BookingPageContent
      data={data}
      dealId={dealId}
      mode="embed"
      serviceSlug={serviceSlug}
      hideGallery={hideGallery}
    />
  );
}
