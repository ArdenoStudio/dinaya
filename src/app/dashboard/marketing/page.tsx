import { db } from "@/db";
import { bookings, businesses, services } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { and, count, eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DirectorySettings } from "@/components/dashboard/DirectorySettings";
import { ReferralSettings } from "@/components/dashboard/ReferralSettings";
import { ServiceBookingLinks } from "@/components/dashboard/ServiceBookingLinks";
import { DashboardCopyField } from "@/components/dashboard/DashboardCopyField";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { buildPublicBookingUrl, getAppBaseUrl } from "@/lib/booking-url";
import {
  buildEmbedIframeSnippet,
  buildEmbedModalSnippet,
  buildEmbedScriptSnippet,
} from "@/lib/booking/embed";
import {
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";

export default async function MarketingPage() {
  const { businessId } = await requireOwner();
  const [business] = await db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      referralCode: businesses.referralCode,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) notFound();

  const serviceList = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
    })
    .from(services)
    .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
    .orderBy(services.name);

  const [{ referralBookings }] = await db
    .select({ referralBookings: count() })
    .from(bookings)
    .where(and(eq(bookings.businessId, businessId), eq(bookings.source, "referral")));

  const referralCode = business.referralCode ?? business.slug;

  const bookingUrl = buildPublicBookingUrl({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });
  const encodedUrl = encodeURIComponent(bookingUrl);
  const qrPng = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=png&data=${encodedUrl}`;
  const qrSvg = `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=svg&data=${encodedUrl}`;
  const whatsappSnippet = `Book your appointment online with ${business.name}: ${bookingUrl}`;
  const instagramSnippet = `${business.name} bookings are open. Tap the link in bio: ${bookingUrl}`;
  const embedSnippet = buildEmbedIframeSnippet(business.slug);
  const embedScriptSnippet = buildEmbedScriptSnippet();
  const embedModalSnippet = buildEmbedModalSnippet(business.slug);
  const reviewsEmbedUrl = `${getAppBaseUrl().replace(/\/$/, "")}/embed/reviews/${business.slug}`;
  const reviewsEmbedSnippet = `<iframe src="${reviewsEmbedUrl}" width="100%" height="420" style="border:0;border-radius:8px"></iframe>`;

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Marketing"
        description="Share your booking page across WhatsApp, Instagram, posters, and your website."
        actions={
          <Link href="/dashboard/booking-page" className={dashboardPrimaryActionClass}>
            Edit booking page
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <DirectorySettings />

          <ReferralSettings
            businessName={business.name}
            slug={business.slug}
            referralCode={referralCode}
            customDomain={business.customDomain}
            customDomainVerified={Boolean(business.customDomainVerified)}
            referralBookings={Number(referralBookings ?? 0)}
          />

          <DashboardSection title="Share tools">
            <code className="block truncate rounded-xl border bg-muted/30 px-3 py-2 text-sm text-primary">
              {bookingUrl}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className={dashboardOutlineActionClass}>
                Open
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappSnippet)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={dashboardOutlineActionClass}
              >
                WhatsApp share
              </a>
              <a href={qrPng} target="_blank" rel="noopener noreferrer" className={dashboardOutlineActionClass}>
                QR PNG
              </a>
              <a href={qrSvg} target="_blank" rel="noopener noreferrer" className={dashboardOutlineActionClass}>
                QR SVG
              </a>
            </div>
          </DashboardSection>

          <ServiceBookingLinks
            slug={business.slug}
            customDomain={business.customDomain}
            customDomainVerified={business.customDomainVerified}
            services={serviceList}
          />

          <DashboardSection title="QR poster">
            <Image
              src={qrPng}
              alt="Booking page QR code"
              width={208}
              height={208}
              unoptimized
              className="mx-auto size-52 rounded-xl border bg-background p-3"
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Add this to your counter, Instagram story, or printed price list.
            </p>
          </DashboardSection>

          <DashboardSection id="marketing-embed" title="Snippets">
            <div className="space-y-4">
              <DashboardCopyField label="WhatsApp / Facebook" value={whatsappSnippet} mono={false} rows={3} />
              <DashboardCopyField label="Instagram bio" value={instagramSnippet} mono={false} rows={3} />
              <DashboardCopyField label="Website embed (iframe)" value={embedSnippet} rows={4} />
              <DashboardCopyField label="Embed script (inline widget)" value={embedScriptSnippet} rows={6} />
              <DashboardCopyField label="Book now modal button" value={embedModalSnippet} rows={5} />
              <DashboardCopyField label="Reviews widget embed" value={reviewsEmbedSnippet} rows={3} />
            </div>
          </DashboardSection>
        </div>

        <DashboardSection
          title="Live preview"
          className="hidden lg:block"
          action={
            <a
              href={`${bookingUrl}?preview=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open full page
            </a>
          }
        >
          <iframe
            src={`${getAppBaseUrl().replace(/\/$/, "")}/embed/book/${business.slug}?embed=1`}
            title={`${business.name} booking page preview`}
            className="h-[720px] w-full rounded-xl border"
          />
        </DashboardSection>
      </div>
    </div>
  );
}
