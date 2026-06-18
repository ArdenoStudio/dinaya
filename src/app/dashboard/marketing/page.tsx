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
import { buildPublicBookingUrl, getAppBaseUrl } from "@/lib/booking-url";
import {
  buildEmbedIframeSnippet,
  buildEmbedModalSnippet,
  buildEmbedScriptSnippet,
} from "@/lib/booking/embed";

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-cal text-2xl">Marketing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your booking page across WhatsApp, Instagram, posters, and your website.
          </p>
        </div>
        <Link
          href="/dashboard/booking-page"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Edit booking page
        </Link>
      </div>

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

          <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
            <h2 className="mb-3 font-semibold">Share tools</h2>
            <code className="block truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-primary">
              {bookingUrl}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-2 text-xs font-medium hover:border-primary/40">Open</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(whatsappSnippet)}`} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-2 text-xs font-medium hover:border-primary/40">WhatsApp share</a>
              <a href={qrPng} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-2 text-xs font-medium hover:border-primary/40">QR PNG</a>
              <a href={qrSvg} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-2 text-xs font-medium hover:border-primary/40">QR SVG</a>
            </div>
          </div>

          <ServiceBookingLinks
            slug={business.slug}
            customDomain={business.customDomain}
            customDomainVerified={business.customDomainVerified}
            services={serviceList}
          />

          <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
            <h2 className="mb-3 font-semibold">QR poster</h2>
            <Image
              src={qrPng}
              alt="Booking page QR code"
              width={208}
              height={208}
              unoptimized
              className="mx-auto size-52 rounded-lg border p-3"
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Add this to your counter, Instagram story, or printed price list.
            </p>
          </div>

          <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
            <h2 className="mb-3 font-semibold">Snippets</h2>
            <label className="text-xs font-medium text-muted-foreground">WhatsApp / Facebook</label>
            <textarea readOnly value={whatsappSnippet} className="mt-1 h-20 w-full resize-none rounded-md border p-2 text-sm" />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Instagram bio</label>
            <textarea readOnly value={instagramSnippet} className="mt-1 h-20 w-full resize-none rounded-md border p-2 text-sm" />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Website embed (iframe)</label>
            <textarea readOnly value={embedSnippet} className="mt-1 h-24 w-full resize-none rounded-md border p-2 font-mono text-xs" />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Embed script (inline widget)</label>
            <textarea readOnly value={embedScriptSnippet} className="mt-1 h-32 w-full resize-none rounded-md border p-2 font-mono text-xs" />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Book now modal button</label>
            <textarea readOnly value={embedModalSnippet} className="mt-1 h-24 w-full resize-none rounded-md border p-2 font-mono text-xs" />
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Reviews widget embed</label>
            <textarea readOnly value={reviewsEmbedSnippet} className="mt-1 h-24 w-full resize-none rounded-md border p-2 font-mono text-xs" />
          </div>
        </div>

        <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Live preview</h2>
            <a href={`${bookingUrl}?preview=1`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              Open full page
            </a>
          </div>
          <iframe
            src={`${getAppBaseUrl().replace(/\/$/, "")}/embed/book/${business.slug}?embed=1`}
            title={`${business.name} booking page preview`}
            className="h-[720px] w-full rounded-lg border"
          />
        </div>
      </div>
    </div>
  );
}
