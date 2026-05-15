import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses, services, staff, staffServices, reviews } from "@/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import BookingWizard from "@/components/booking/BookingWizard";
import Link from "next/link";

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
    .select()
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) notFound();

  const [serviceList, staffList, reviewList, ratingData] = await Promise.all([
    db.select().from(services).where(and(eq(services.businessId, business.id), eq(services.isActive, true))),
    db.select().from(staff).where(and(eq(staff.businessId, business.id), eq(staff.isActive, true))),
    db.select().from(reviews)
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true)))
      .orderBy(reviews.createdAt)
      .limit(20),
    db.select({ avg: avg(reviews.rating), count: count() })
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

  return (
    <div className="min-h-dvh bg-[#f7f7f8]">

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-5 py-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={business.name}
                className="size-16 rounded-2xl object-cover border shrink-0"
              />
            ) : (
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                <span className="text-primary font-bold text-2xl">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-cal text-2xl leading-tight">{business.name}</h1>

              {/* Rating summary */}
              {avgRating !== null && reviewCount > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <StarRating rating={avgRating} />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
                </div>
              )}

              {business.description && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{business.description}</p>
              )}

              {/* Info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                {business.address && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <i className="bi bi-geo-alt text-[10px]" />
                    {business.address}
                  </span>
                )}
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <i className="bi bi-telephone text-[10px]" />
                    {business.phone}
                  </a>
                )}
              </div>

              {/* Social links */}
              {(business.instagramUrl || business.facebookUrl || business.websiteUrl) && (
                <div className="flex items-center gap-2 mt-2.5">
                  {business.instagramUrl && (
                    <a
                      href={business.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center size-7 rounded-lg bg-gray-100 hover:bg-pink-50 hover:text-pink-600 text-gray-500 transition-colors text-sm"
                    >
                      <i className="bi bi-instagram" />
                    </a>
                  )}
                  {business.facebookUrl && (
                    <a
                      href={business.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center size-7 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-colors text-sm"
                    >
                      <i className="bi bi-facebook" />
                    </a>
                  )}
                  {business.websiteUrl && (
                    <a
                      href={business.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center size-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-sm"
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

      {/* ── Portfolio gallery ─────────────────────────────────────── */}
      {gallery.length > 0 && (
        <div className="max-w-2xl mx-auto px-5 pt-5">
          <div className={`grid gap-2 rounded-2xl overflow-hidden ${
            gallery.length === 1 ? "grid-cols-1" :
            gallery.length === 2 ? "grid-cols-2" :
            gallery.length >= 3 ? "grid-cols-3" : ""
          }`}>
            {gallery.slice(0, 6).map((url, i) => (
              <div
                key={url}
                className={`relative bg-muted overflow-hidden ${
                  gallery.length === 3 && i === 0 ? "col-span-2 row-span-2 aspect-square" :
                  gallery.length >= 4 && i === 0 ? "col-span-2 aspect-video" :
                  "aspect-square"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 5 && gallery.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{gallery.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking wizard ────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="font-cal text-lg">Book an appointment</h2>
          <p className="text-sm text-muted-foreground">Choose a service and pick a time that works for you.</p>
        </div>
        <BookingWizard
          business={business}
          services={serviceList}
          staff={staffList}
          staffServiceMap={assignments}
        />
      </div>

      {/* ── Team section ──────────────────────────────────────────── */}
      {staffWithBio.length > 0 && (
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <h2 className="font-cal text-lg mb-4">Meet the team</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {staffWithBio.map((member) => (
              <div key={member.id} className="bg-white border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="size-14 rounded-full object-cover border"
                  />
                ) : (
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                    <span className="text-primary font-bold text-xl">{member.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  {member.bio && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-3">{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews ───────────────────────────────────────────────── */}
      {reviewList.length > 0 && (
        <div className="max-w-2xl mx-auto px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-cal text-lg">Reviews</h2>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating rating={avgRating} size="md" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">from {reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {reviewList.map((review) => (
              <div key={review.id} className="bg-white border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{review.clientName}</p>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="text-center pb-8 text-xs text-muted-foreground/60">
        Powered by{" "}
        <Link href="https://dinaya.lk" className="text-primary hover:underline">
          Dinaya.lk
        </Link>
      </footer>
    </div>
  );
}
