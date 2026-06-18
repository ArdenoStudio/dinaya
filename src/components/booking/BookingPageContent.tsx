import Image from "next/image";
import { headers } from "next/headers";
import BookingWizard from "@/components/booking/BookingWizard";
import BookingMobileTrustStrip from "@/components/booking/BookingMobileTrustStrip";
import EmbedResizeReporter from "@/components/booking/EmbedResizeReporter";
import BookingServiceHub from "@/components/booking/BookingServiceHub";
import { BookingTheme } from "@/components/booking/BookingTheme";
import { BookingThemeToggle } from "@/components/booking/BookingThemeToggle";
import { getBookingCopy } from "@/lib/i18n";
import { normalizePublicHttpsUrl } from "@/lib/public-url";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      <div className="booking-page-bg min-h-dvh bg-[#f2f2f7] md:bg-[#f7f7f8]" data-booking-embed-root={mode === "embed" ? "" : undefined}>
        {mode === "embed" ? <EmbedResizeReporter slug={business.slug} /> : null}
        {mode !== "embed" ? <BookingThemeToggle /> : null}
        <div className="mx-auto max-w-5xl px-0 md:px-8 md:py-6">
          {!hideSidebarSections && gallery.length > 0 && (
            <div className="px-4 pb-4 pt-4 md:px-0 md:pb-6 md:pt-0">
              <div
                className={`grid gap-2 overflow-hidden rounded-2xl ${
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
                    className={`relative overflow-hidden bg-gray-200 dark:bg-neutral-700 ${
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
            </div>
          )}

          {!hideSidebarSections && hasTrustBlock && (
            <Card className="mx-4 mb-4 border-dashed bg-muted/30 md:mx-0">
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
          )}

          {showHub && (
            <BookingServiceHub businessSlug={business.slug} businessName={business.name} businessLogoUrl={business.logoUrl} services={services} copy={copy} />
          )}

          {showWizard && (
            <>
              <BookingMobileTrustStrip
                description={business.description}
                avgRating={avgRating}
                reviewCount={reviewCount}
                cancellationPolicy={business.cancellationPolicy}
                securedLabel={copy.securedByPayHere}
              />
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
            />
            </>
          )}

          {!hideSidebarSections && hasAboutSection && (
            <Card className="mt-6 hidden md:block">
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

          {!hideSidebarSections && staffWithBio.length > 0 && (
            <section className="mt-6 px-4 md:px-0">
              <Card className="overflow-hidden py-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Meet the team</CardTitle>
                </CardHeader>
                <Separator />
                {staffWithBio.length === 1 ? (
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="size-16" data-size="lg">
                      {staffWithBio[0]!.avatarUrl ? (
                        <AvatarImage src={staffWithBio[0]!.avatarUrl} alt={staffWithBio[0]!.name} />
                      ) : null}
                      <AvatarFallback className="bg-[var(--booking-accent-muted)] text-2xl font-bold text-[var(--booking-accent)]">
                        {staffWithBio[0]!.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{staffWithBio[0]!.name}</p>
                      {staffWithBio[0]!.bio && (
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{staffWithBio[0]!.bio}</p>
                      )}
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="grid gap-px bg-border p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {staffWithBio.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col items-center gap-2 bg-card p-4 text-center"
                      >
                        <Avatar className="size-14" data-size="lg">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          ) : null}
                          <AvatarFallback className="bg-[var(--booking-accent-muted)] text-xl font-bold text-[var(--booking-accent)]">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{member.name}</p>
                          {member.bio && (
                            <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                              {member.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            </section>
          )}

          {!hideSidebarSections && reviewList.length > 0 && (
            <section className="mt-8 space-y-4 px-4 pb-8 md:px-0">
              <div>
                <h2 className="font-cal text-lg text-foreground">Reviews</h2>
                {avgRating !== null && (
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={avgRating} size="md" />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {reviewList.map((review) => (
                  <Card key={review.id}>
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
