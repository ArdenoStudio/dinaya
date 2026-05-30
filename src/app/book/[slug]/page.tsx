import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { businesses, services, staff, staffServices, reviews } from "@/db/schema";
import { listActiveLocations, getStaffLocationMap, ensureBusinessHasDefaultLocation } from "@/lib/locations";
import { eq, and, avg, count } from "drizzle-orm";
import BookingWizard from "@/components/booking/BookingWizard";
import { getBookingCopy } from "@/lib/i18n";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { listActiveDealsForBusiness } from "@/lib/deals/queries";
import { normalizePublicHttpsUrl } from "@/lib/public-url";
import { Icon } from "@/components/ui/Icon";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [business] = await db
    .select({ name: businesses.name, description: businesses.description })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) return {};
  return {
    title: `Book an appointment — ${business.name}`,
    description: business.description ?? `Book online with ${business.name}`,
  };
}

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

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { dealId } = await searchParams;

  const [business] = await db
    .select({
      id: businesses.id,
      address: businesses.address,
      bankTransferInstructions: businesses.bankTransferInstructions,
      cancellationPolicy: businesses.cancellationPolicy,
      deletedAt: businesses.deletedAt,
      description: businesses.description,
      depositPolicy: businesses.depositPolicy,
      facebookUrl: businesses.facebookUrl,
      galleryImages: businesses.galleryImages,
      instagramUrl: businesses.instagramUrl,
      isSuspended: businesses.isSuspended,
      language: businesses.language,
      lankaqrImageUrl: businesses.lankaqrImageUrl,
      logoUrl: businesses.logoUrl,
      name: businesses.name,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      payhereEnabled: businesses.payhereEnabled,
      phone: businesses.phone,
      slug: businesses.slug,
      websiteUrl: businesses.websiteUrl,
      hideDinayaBranding: businesses.hideDinayaBranding,
    })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business || business.deletedAt) notFound();

  if (business.isSuspended) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="font-cal text-2xl tracking-tight">{business.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Online booking is temporarily unavailable for this business.
          </p>
        </div>
      </main>
    );
  }

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });

  // Trial and paid plans keep the public booking page; once it lapses to "expired"
  // the page goes offline until the owner subscribes.
  if (!canUseFeature(effectivePlan, "publicBookingPage")) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="font-cal text-2xl tracking-tight">{business.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Online booking is temporarily unavailable for this business.
          </p>
        </div>
      </main>
    );
  }

  await ensureBusinessHasDefaultLocation(business.id);

  const showBranding = true;

  const [serviceList, staffList, reviewList, ratingData, locationList, staffLocationMap, activeDeals] = await Promise.all([
    db
      .select({
        id: services.id,
        businessId: services.businessId,
        name: services.name,
        description: services.description,
        durationMinutes: services.durationMinutes,
        priceLkr: services.priceLkr,
        requiresPayment: services.requiresPayment,
        depositPercent: services.depositPercent,
        isActive: services.isActive,
        beforeBuffer: services.beforeBuffer,
        afterBuffer: services.afterBuffer,
        minimumNoticeHours: services.minimumNoticeHours,
        dailyCapacity: services.dailyCapacity,
        createdAt: services.createdAt,
      })
      .from(services)
      .where(and(eq(services.businessId, business.id), eq(services.isActive, true))),
    db.select().from(staff).where(and(eq(staff.businessId, business.id), eq(staff.isActive, true))),
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true)))
      .orderBy(reviews.createdAt)
      .limit(20),
    db
      .select({ avg: avg(reviews.rating), count: count() })
      .from(reviews)
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true))),
    listActiveLocations(business.id),
    getStaffLocationMap(business.id),
    listActiveDealsForBusiness(business.id),
  ]);

  const assignments = await db
    .select({ staffId: staffServices.staffId, serviceId: staffServices.serviceId })
    .from(staffServices)
    .innerJoin(staff, eq(staffServices.staffId, staff.id))
    .where(eq(staff.businessId, business.id));

  const avgRating = ratingData[0]?.avg ? parseFloat(ratingData[0].avg) : null;
  const reviewCount = ratingData[0]?.count ?? 0;
  const gallery = business.galleryImages ?? [];
  const staffWithBio = staffList.filter((s) => s.bio || s.avatarUrl);
  const copy = getBookingCopy(business.language);
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
      business.lankaqrImageUrl
  );

  const hasAboutSection = Boolean(
    business.description ||
      business.address ||
      business.phone ||
      instagramUrl ||
      facebookUrl ||
      websiteUrl ||
      (avgRating !== null && reviewCount > 0)
  );

  return (
    <div className="min-h-dvh bg-[#f2f2f7] md:bg-[#f7f7f8]">
      <div className="mx-auto max-w-5xl px-0 md:px-8 md:py-6">
        {/* Gallery — above booking on all breakpoints */}
        {gallery.length > 0 && (
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
                  {i === 5 && gallery.length > 6 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-lg font-semibold text-white">+{gallery.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust / policies — compact, before wizard on desktop */}
        {hasTrustBlock && (
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

        <BookingWizard
          business={{
            ...business,
            hideBranding: Boolean(
              business.hideDinayaBranding &&
              canUseFeature(effectivePlan, "publicBookingPageCustomization")
            ),
          }}
          services={serviceList}
          staff={staffList}
          staffServiceMap={assignments}
          staffLocationMap={staffLocationMap}
          locations={locationList}
          bookingUrlLabel={bookingUrlLabel}
          showBranding={showBranding}
          activeDeals={activeDeals}
          initialDealId={dealId ?? null}
        />

        {hasAboutSection && (
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
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              {business.address && (
                <span className="flex items-center gap-1.5">
                  <Icon name="geo-alt" className="text-gray-400" />
                  {business.address}
                </span>
              )}
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-gray-800">
                  <Icon name="telephone" className="text-gray-400" />
                  {business.phone}
                </a>
              )}
            </div>
            {(instagramUrl || facebookUrl || websiteUrl) && (
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                  >
                    <Icon name="instagram" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon name="facebook" />
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
                  >
                    <Icon name="globe" />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {/* Team */}
        {staffWithBio.length > 0 && (
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
                    <div className="flex size-14 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xl font-bold text-blue-600">
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

        {/* Reviews */}
        {reviewList.length > 0 && (
          <section className="mt-8 px-4 pb-8 md:px-0">
            <div className="mb-4">
              <h2 className="font-cal text-lg text-gray-900">Reviews</h2>
              {avgRating !== null && (
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={avgRating} size="md" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">
                    from {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </span>
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
                    <p className="shrink-0 text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-LK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed text-gray-500">{review.comment}</p>
                  )}
                  {review.ownerReply ? (
                    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-700">Response from {business.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{review.ownerReply}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
