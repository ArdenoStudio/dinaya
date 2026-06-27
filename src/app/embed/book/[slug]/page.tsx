import BookingPageContent from "@/components/booking/BookingPageContent";
import { loadBookingPageData } from "@/lib/booking/load-page-data";
import { parseBookingThemePreviewParams } from "@/lib/booking-theme";
import { parseBookingContentPreviewParams } from "@/lib/booking/theme-editor-preview";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    dealId?: string;
    service?: string;
    name?: string;
    email?: string;
    phone?: string;
    hideGallery?: string;
    previewAccent?: string;
    previewPageBg?: string;
    previewPageBgColor?: string;
    previewHeroOverlay?: string;
    previewHeroOpacity?: string;
    previewPanelBg?: string;
    previewLogo?: string;
    previewGallery?: string;
    previewHideBranding?: string;
  }>;
}

export default async function EmbedBookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const { dealId, service: serviceSlug, hideGallery: hideGalleryParam } = query;
  const hideGallery = hideGalleryParam === "1" || hideGalleryParam === "true";
  const previewParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      previewParams.set(key, value);
    }
  }
  const themePreview = parseBookingThemePreviewParams(previewParams);
  const contentPreview = parseBookingContentPreviewParams(previewParams);
  const data = await loadBookingPageData(slug, serviceSlug);

  if (data.status !== "ok") {
    return (
      <main className="flex min-h-[480px] items-center justify-center bg-gray-50 dark:bg-neutral-900/60 px-6">
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
      themePreview={themePreview}
      contentPreview={contentPreview}
    />
  );
}
