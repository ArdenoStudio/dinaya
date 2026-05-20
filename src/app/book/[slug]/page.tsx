import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses, services, staff, staffServices, reviews } from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import BookingWizard from "@/components/booking/BookingWizard";
import Link from "next/link";
import { getBookingCopy } from "@/lib/i18n";

interface Props {
  params: Promise<{ slug: string }>;
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
        <i
          key={n}
          className={`bi ${n <= Math.round(rating) ? "bi-star-fill text-amber-400" : "bi-star text-gray-300"} ${starSize}`}
        />
      ))}
    </span>
  );
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;

  const [business] = await db
    .select({
      id: businesses.id,
      address: businesses.address,
      bankTransferInstructions: businesses.bankTransferInstructions,
      cancellationPolicy: businesses.cancellationPolicy,
      description: businesses.description,
      depositPolicy: businesses.depositPolicy,
      facebookUrl: businesses.facebookUrl,
      galleryImages: businesses.galleryImages,
      instagramUrl: businesses.instagramUrl,
      language: businesses.language,
      lankaqrImageUrl: businesses.lankaqrImageUrl,
      logoUrl: businesses.logoUrl,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      phone: businesses.phone,
      slug: businesses.slug,
      websiteUrl: businesses.websiteUrl,
    })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) notFound();

  const [serviceList, staffList, reviewList, ratingData] = await Promise.all([
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

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "";
  const bookingUrlLabel =
    appDomain === "dinaya.lk" ? `${business.slug}.dinaya.lk` : `${business.slug} · Dinaya`;

  const hasTrustBlock = Boolean(
    business.cancellationPolicy ||
      business.depositPolicy ||
      business.bankTransferInstructions ||
      business.lankaqrImageUrl
  );

  return (
    <div className="min-h-dvh bg-[#f2f2f7] md:bg-[#f7f7f8]">
      {/* Desktop page header — business context above the booking card */}
      <div className="hidden border-b border-gray-100 bg-white md:block">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={business.name}
                className="size-14 shrink-0 rounded-2xl border object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-cal text-2xl text-gray-900">{business.name}</h1>
              {avgRating !== null && reviewCount > 0 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <StarRating rating={avgRating} />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">
                    ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              {business.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                  {business.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                {business.address && (
                  <span className="flex items-center gap-1">
                    <i className="bi bi-geo-alt" />
                    {business.address}
                  </span>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-1 hover:text-gray-700">
                    <i className="bi bi-telephone" />
                    {business.phone}
                  </a>
                )}
              </div>
              {(business.instagramUrl || business.facebookUrl || business.websiteUrl) && (
                <div className="mt-3 flex items-center gap-2">
                  {business.instagramUrl && (
                    <a
                      href={business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600"
                    >
                      <i className="bi bi-instagram" />
                    </a>
                  )}
                  {business.facebookUrl && (
                    <a
                      href={business.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <i className="bi bi-facebook" />
                    </a>
                  )}
                  {business.websiteUrl && (
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                    >
                      <i className="bi bi-globe" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-0 md:px-6 md:py-8">
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
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
          business={business}
          services={serviceList}
          staff={staffList}
          staffServiceMap={assignments}
          bookingUrlLabel={bookingUrlLabel}
        />

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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="size-14 rounded-full border object-cover"
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
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="hidden pb-10 text-center text-xs text-gray-400 md:block">
          {copy.poweredBy}{" "}
          <Link href="https://dinaya.lk" className="text-blue-600 hover:underline">
            Dinaya.lk
          </Link>
        </footer>
      </div>
    </div>
  );
}
