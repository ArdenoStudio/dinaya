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
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent } from "@/components/ui/card";
import { BookingTeamSection } from "@/components/booking/BookingTeamSection";
import type { BookingPageData } from "@/lib/booking/load-page-data";
import { createCalendarOverlayTicket } from "@/lib/calendar-overlay-ticket";
import type { CalendarOverlayConfig } from "./useGoogleCalendarOverlay";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "text-base" : "text-xs";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name={n <= Math.round(rating) ? "star-fill" : "star"}
          className={`${n <= Math.round(rating) ? "text-amber-400" : "text-gray-300 dark:text-neutral-600"} ${starSize}`}
        />
      ))}
    </span>
  );
}

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
  if (mode === "embed" || !process.env.GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
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
    const { ticket, channel } = createCalendarOverlayTicket(
      origin,
      language === "si" || language === "ta" ? language : "en",
    );
    const connectUrl = new URL("/calendar-overlay/connect", process.env.NEXT_PUBLIC_APP_URL);
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

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "";
  const bookingUrlLabel =
    appDomain === "dinaya.lk" ? `${business.slug}.dinaya.lk` : `${business.slug} · Dinaya`;

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
      websiteUrl ||
      (avgRating !== null && reviewCount > 0),
  );

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

  return (
    <BookingTheme accentColor={business.accentColor} embed={mode === "embed"}>
      <div
        className={
          centeredLayout
            ? "booking-page-bg flex min-h-dvh flex-col items-center bg-muted/20 md:justify-center md:py-10"
            : "booking-page-bg min-h-dvh bg-muted/30"
        }
        data-booking-embed-root={mode === "embed" ? "" : undefined}
      >
        {mode === "embed" ? <EmbedResizeReporter slug={business.slug} /> : null}
        {mode !== "embed" ? <BookingThemeToggle /> : null}
        <div
          className={
            centeredLayout
              ? "w-full max-w-4xl px-0 md:px-4"
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
              bookingUrlLabel={bookingUrlLabel}
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
            <Card
              className={`mt-0 overflow-hidden rounded-none border-x-0 shadow-none ${
                centeredLayout
                  ? "mt-6 border-border/60 md:rounded-xl md:border-x md:shadow-none"
                  : "md:mt-6 md:rounded-xl md:border-x md:shadow-sm"
              }`}
            >
              <CardContent className="p-6">
                {avgRating !== null && reviewCount > 0 && (
                  <div className="mb-4 flex items-center gap-2">
                    <StarRating rating={avgRating} size="md" />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
                {business.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{business.description}</p>
                )}
              </CardContent>
            </Card>
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

          {!hideSidebarSections && reviewList.length > 0 && (
            <section className="space-y-4 px-0 pb-8 md:px-0">
              <div className="border-b border-border bg-card px-4 py-4 md:border-0 md:bg-transparent md:px-0 md:py-0">
                <h2 className="font-cal text-lg text-foreground">Reviews</h2>
                {avgRating !== null && (
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={avgRating} size="md" />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-0 md:space-y-3">
                {reviewList.map((review) => (
                  <Card
                    key={review.id}
                    className="rounded-none border-x-0 border-t-0 shadow-none md:rounded-xl md:border md:shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{review.clientName}</p>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </BookingTheme>
  );
}
