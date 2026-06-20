import Image from "next/image";
import { headers } from "next/headers";
import BookingWizard from "@/components/booking/BookingWizard";
import EmbedResizeReporter from "@/components/booking/EmbedResizeReporter";
import BookingServiceHub from "@/components/booking/BookingServiceHub";
import { BookingPolicyAccordion } from "@/components/booking/BookingPolicyAccordion";
import { BookingTheme } from "@/components/booking/BookingTheme";
import { BookingThemeToggle } from "@/components/booking/BookingThemeToggle";
import { getBookingCopy } from "@/lib/i18n";
import { normalizePublicHttpsUrl } from "@/lib/public-url";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BookingTeamSection } from "@/components/booking/BookingTeamSection";
import { BookingReviewsSection } from "@/components/booking/BookingReviewsSection";
import { BookingHubGallery } from "@/components/booking/BookingHubGallery";
import { BookingHubStickyCta } from "@/components/booking/BookingHubStickyCta";
import { DotBackground } from "@/components/ui/dot-background";
import { BlurFade } from "@/components/ui/blur-fade";
import { getBusinessRating } from "@/components/booking/BusinessRating";
import type { BookingPageData } from "@/lib/booking/load-page-data";
import {
  createCalendarOverlayTicket,
  isCalendarOverlayOriginAllowed,
} from "@/lib/calendar-overlay-ticket";
import type { CalendarOverlayConfig } from "./useGoogleCalendarOverlay";

type Props = {
  data: Extract<BookingPageData, { status: "ok" }>;
  dealId?: string | null;
  mode: "hub" | "service" | "embed";
  serviceSlug?: string;
  hideGallery?: boolean;
};

async function buildCalendarOverlayConfig(
  mode: Props["mode"],
  language: string,
): Promise<CalendarOverlayConfig | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (mode === "embed" || !process.env.GOOGLE_CLIENT_ID || !appUrl) {
    return null;
  }

  try {
    const requestHeaders = await headers();
    const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || requestHeaders.get("host");
    if (!host) return null;

    const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol =
      forwardedProto || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    const origin = new URL(`${protocol}://${host}`).origin;
    if (
      !isCalendarOverlayOriginAllowed({
        origin,
        appUrl,
        appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
      })
    ) {
      return null;
    }
    const { ticket, channel } = createCalendarOverlayTicket(
      origin,
      language === "si" || language === "ta" ? language : "en",
    );
    const connectUrl = new URL("/calendar-overlay/connect", appUrl);
    connectUrl.searchParams.set("ticket", ticket);
    return { connectUrl: connectUrl.toString(), channel };
  } catch {
    return null;
  }
}

export default async function BookingPageContent({ data, dealId, mode, serviceSlug, hideGallery }: Props) {
  const {
    business,
    services,
    staff,
    staffServiceMap,
    staffLocationMap,
    locations,
    reviews: reviewList,
    avgRating,
    reviewCount,
    reviewDistribution,
    activeDeals,
    bookingRouter,
    hideBranding,
    initialService,
  } = data;

  const copy = getBookingCopy(business.language);
  const calendarOverlayConfig = await buildCalendarOverlayConfig(mode, business.language);
  const gallery = business.galleryImages ?? [];
  const staffWithBio = staff.filter((s) => s.bio || s.avatarUrl);
  const instagramUrl = normalizePublicHttpsUrl(business.instagramUrl);
  const facebookUrl = normalizePublicHttpsUrl(business.facebookUrl);
  const websiteUrl = normalizePublicHttpsUrl(business.websiteUrl);

  const hasTrustBlock = Boolean(
    business.cancellationPolicy ||
      business.depositPolicy ||
      business.bankTransferInstructions ||
      business.lankaqrImageUrl,
  );

  const hasAboutSection = Boolean(
    business.description ||
      business.address ||
      business.phone ||
      instagramUrl ||
      facebookUrl ||
      websiteUrl,
  );

  const businessRating = getBusinessRating(avgRating, reviewCount);
  const initialReviews = reviewList.map((review) => ({
    id: review.id,
    clientName: review.clientName,
    rating: review.rating,
    comment: review.comment,
    ownerReply: review.ownerReply,
    createdAt: review.createdAt.toISOString(),
  }));

  const showHub = mode === "hub" && services.length > 1;
  const showWizard =
    mode === "service" ||
    mode === "embed" ||
    services.length === 1;

  /** Single-service booker or multi-service hub — cal.com-style centered card */
  const bookerFocus = mode === "service" || mode === "embed" || services.length === 1;
  const centeredLayout = bookerFocus || showHub;

  const wizardService =
    mode === "service"
      ? initialService
      : services.length === 1
        ? services[0]!
        : null;

  const hideSidebarSections =
    mode === "embed" ? hideGallery !== false : Boolean(hideGallery);

  const hubPrimaryService = showHub ? services[0] : null;

  return (
    <BookingTheme accentColor={business.accentColor} embed={mode === "embed"}>
      <DotBackground
        className={
          centeredLayout
            ? "booking-page-bg flex min-h-dvh flex-col items-center md:justify-center md:py-10"
            : "booking-page-bg min-h-dvh"
        }
        data-booking-embed-root={mode === "embed" ? "" : undefined}
      >
        {mode === "embed" ? <EmbedResizeReporter slug={business.slug} /> : null}
        {mode !== "embed" ? <BookingThemeToggle /> : null}
        <div
          className={
            centeredLayout
              ? "w-full max-w-5xl px-0 md:px-4"
              : "mx-auto max-w-5xl px-0 md:px-8 md:py-6"
          }
        >
          {!centeredLayout && !hideSidebarSections && gallery.length > 0 && (
            <Card className="overflow-hidden rounded-none border-x-0 border-t-0 shadow-none md:mb-6 md:rounded-xl md:border-x md:shadow-sm">
              <div
                className={`grid gap-0.5 overflow-hidden md:gap-2 ${
                  gallery.length === 1
                    ? "grid-cols-1"
                    : gallery.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                }`}
              >
                {gallery.slice(0, 6).map((url, i) => (
                  <div
                    key={url}
                    className={`relative overflow-hidden bg-muted ${
                      gallery.length === 3 && i === 0
                        ? "col-span-2 row-span-2 aspect-square"
                        : gallery.length >= 4 && i === 0
                          ? "col-span-2 aspect-video"
                          : "aspect-square"
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized={!isOptimizableRemoteImage(url)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!centeredLayout && !hideSidebarSections && hasTrustBlock && (
            <>
              <BookingPolicyAccordion
                copy={copy}
                cancellationPolicy={business.cancellationPolicy}
                depositPolicy={business.depositPolicy}
                bankTransferInstructions={business.bankTransferInstructions}
              />
              <Card className="mx-0 mb-4 hidden border-dashed bg-muted/30 md:mx-0 md:block">
                <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-2">
                  {business.cancellationPolicy && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{copy.cancellationPolicy}</p>
                      <p className="text-muted-foreground">{business.cancellationPolicy}</p>
                    </div>
                  )}
                  {business.depositPolicy && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{copy.depositPolicy}</p>
                      <p className="text-muted-foreground">{business.depositPolicy}</p>
                    </div>
                  )}
                  {business.bankTransferInstructions && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="font-medium text-foreground">{copy.localPayment}</p>
                      <p className="text-muted-foreground">{business.bankTransferInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {showHub && !hideSidebarSections && gallery.length > 0 && (
            <BookingHubGallery images={gallery} className="mt-6" />
          )}

          {showHub && (
            <BookingServiceHub
              businessSlug={business.slug}
              businessName={business.name}
              businessLogoUrl={business.logoUrl}
              services={services}
              copy={copy}
              avgRating={avgRating}
              reviewCount={reviewCount}
            />
          )}

          {showWizard && (
            <BookingWizard
              business={{
                id: business.id,
                accentColor: business.accentColor,
                bankTransferInstructions: business.bankTransferInstructions,
                cancellationPolicy: business.cancellationPolicy,
                depositPolicy: business.depositPolicy,
                language: business.language,
                timezone: business.timezone,
                lankaqrImageUrl: business.lankaqrImageUrl,
                name: business.name,
                payhereEnabled: business.payhereEnabled,
                paypalEnabled: business.paypalEnabled,
                slug: business.slug,
                logoUrl: business.logoUrl,
                hideBranding,
              }}
              services={services}
              bookingRouter={bookingRouter}
              staff={staff}
              staffServiceMap={staffServiceMap}
              staffLocationMap={staffLocationMap}
              locations={locations}
              showBranding
              activeDeals={activeDeals}
              initialDealId={dealId ?? null}
              initialService={wizardService}
              lockServiceSelection={mode === "service" && Boolean(serviceSlug)}
              embedMode={mode === "embed"}
              calendarOverlayConfig={calendarOverlayConfig}
              avgRating={avgRating}
              reviewCount={reviewCount}
              businessDescription={business.description}
              teamMembers={staffWithBio}
              hubHref={
                mode === "service" && services.length > 1 ? `/book/${business.slug}` : null
              }
            />
          )}

          {centeredLayout && !hideSidebarSections && hasTrustBlock && (
            <div className="mt-4 border-t border-border/60 px-4 pt-4 md:mt-5 md:rounded-xl md:border md:bg-card/50 md:px-5 md:py-4">
              <BookingPolicyAccordion
                copy={copy}
                cancellationPolicy={business.cancellationPolicy}
                depositPolicy={business.depositPolicy}
                bankTransferInstructions={business.bankTransferInstructions}
              />
              <div className="hidden space-y-3 text-center text-xs text-muted-foreground md:block">
                {business.cancellationPolicy && (
                  <p>
                    <span className="font-medium text-foreground">{copy.cancellationPolicy}:</span>{" "}
                    {business.cancellationPolicy}
                  </p>
                )}
                {business.depositPolicy && (
                  <p>
                    <span className="font-medium text-foreground">{copy.depositPolicy}:</span>{" "}
                    {business.depositPolicy}
                  </p>
                )}
              </div>
            </div>
          )}

          {!hideSidebarSections && hasAboutSection && (
            <BlurFade>
              <Card
                className={`mt-0 overflow-hidden rounded-none border-x-0 shadow-none ${
                  centeredLayout
                    ? "mt-6 border-border/60 md:rounded-xl md:border-x md:shadow-none"
                    : "md:mt-6 md:rounded-xl md:border-x md:shadow-sm"
                }`}
              >
                <CardContent className="p-6">
                  {business.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{business.description}</p>
                  )}
                </CardContent>
              </Card>
            </BlurFade>
          )}

          {showHub && !hideSidebarSections && staffWithBio.length > 0 && (
            <BookingTeamSection
              members={staffWithBio}
              copy={copy}
              variant="dialog"
              className="mt-6 flex justify-center"
            />
          )}

          {!centeredLayout && !hideSidebarSections && staffWithBio.length > 0 && (
            <BookingTeamSection
              members={staffWithBio}
              copy={copy}
              variant={staffWithBio.length > 3 ? "dialog" : "card"}
              className={staffWithBio.length > 3 ? "mt-6 flex justify-center" : "md:px-0"}
            />
          )}

          {!hideSidebarSections && businessRating && (
            <BookingReviewsSection
              businessSlug={business.slug}
              businessName={business.name}
              avgRating={businessRating.avgRating}
              reviewCount={businessRating.reviewCount}
              reviewDistribution={reviewDistribution}
              initialReviews={initialReviews}
              copy={copy}
              className={`flex justify-center pb-8 ${centeredLayout ? "mt-3" : "mt-6"}`}
            />
          )}
        </div>
        {showHub && hubPrimaryService ? (
          <BookingHubStickyCta
            businessSlug={business.slug}
            serviceSlug={hubPrimaryService.slug ?? hubPrimaryService.id}
            label={copy.chooseService}
          />
        ) : null}
      </DotBackground>
    </BookingTheme>
  );
}
