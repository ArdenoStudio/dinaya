import Image from "next/image";
import BookingWizard from "@/components/booking/BookingWizard";
import BookingServiceHub from "@/components/booking/BookingServiceHub";
import { BookingTheme } from "@/components/booking/BookingTheme";
import { getBookingCopy } from "@/lib/i18n";
import { normalizePublicHttpsUrl } from "@/lib/public-url";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import type { BookingPageData } from "@/lib/booking/load-page-data";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "text-base" : "text-xs";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name={n <= Math.round(rating) ? "star-fill" : "star"}
          className={`${n <= Math.round(rating) ? "text-amber-400" : "text-gray-300"} ${starSize}`}
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
};

export default function BookingPageContent({ data, dealId, mode, serviceSlug }: Props) {
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

  const hideGallery = mode === "embed";

  return (
    <BookingTheme accentColor={business.accentColor} embed={mode === "embed"}>
      <div className="min-h-dvh bg-[#f2f2f7] md:bg-[#f7f7f8]">
        <div className="mx-auto max-w-5xl px-0 md:px-8 md:py-6">
          {!hideGallery && gallery.length > 0 && (
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
                    className={`relative overflow-hidden bg-gray-200 ${
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

          {!hideGallery && hasTrustBlock && (
            <div className="mx-4 mb-4 rounded-xl border border-gray-100 bg-white p-4 md:mx-0 md:mb-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {copy.trustTitle}
              </p>
              <div className="space-y-3 text-sm text-gray-500">
                {business.cancellationPolicy && (
                  <div>
                    <p className="font-medium text-gray-800">{copy.cancellationPolicy}</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{business.cancellationPolicy}</p>
                  </div>
                )}
                {business.depositPolicy && (
                  <div>
                    <p className="font-medium text-gray-800">{copy.depositPolicy}</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{business.depositPolicy}</p>
                  </div>
                )}
                {(business.bankTransferInstructions || business.lankaqrImageUrl) && (
                  <div>
                    <p className="font-medium text-gray-800">{copy.localPayment}</p>
                    {business.bankTransferInstructions && (
                      <p className="mt-0.5 whitespace-pre-wrap">{business.bankTransferInstructions}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {showHub && (
            <BookingServiceHub businessSlug={business.slug} services={services} copy={copy} />
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
                lankaqrImageUrl: business.lankaqrImageUrl,
                name: business.name,
                payhereEnabled: business.payhereEnabled,
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
            />
          )}

          {!hideGallery && hasAboutSection && (
            <section className="mt-6 hidden rounded-2xl border border-gray-100 bg-white p-6 md:block">
              {avgRating !== null && reviewCount > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <StarRating rating={avgRating} size="md" />
                  <span className="font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">
                    ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              {business.description && (
                <p className="text-sm leading-relaxed text-gray-600">{business.description}</p>
              )}
            </section>
          )}

          {!hideGallery && staffWithBio.length > 0 && (
            <section className="mt-8 px-4 md:px-0">
              <h2 className="mb-4 font-cal text-lg text-gray-900">Meet the team</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {staffWithBio.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-center"
                  >
                    {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={56}
                        height={56}
                        className="size-14 rounded-full border object-cover"
                        unoptimized={!isOptimizableRemoteImage(member.avatarUrl)}
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-full border booking-bg-accent-muted text-xl font-bold booking-text-accent">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.bio && (
                        <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-gray-500">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hideGallery && reviewList.length > 0 && (
            <section className="mt-8 px-4 pb-8 md:px-0">
              <div className="mb-4">
                <h2 className="font-cal text-lg text-gray-900">Reviews</h2>
                {avgRating !== null && (
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={avgRating} size="md" />
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {reviewList.map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{review.clientName}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm leading-relaxed text-gray-500">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </BookingTheme>
  );
}
