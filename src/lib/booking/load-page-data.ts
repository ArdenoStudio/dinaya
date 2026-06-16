import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses, services, staff, staffServices, reviews } from "@/db/schema";
import { listActiveLocations, getStaffLocationMap, ensureBusinessHasDefaultLocation } from "@/lib/locations";
import { eq, and, avg, count } from "drizzle-orm";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";
import { resolveActiveRouter } from "@/lib/booking-router";
import { listActiveDealsForBusiness } from "@/lib/deals/queries";
import { backfillServiceSlugsForBusiness } from "@/lib/slot-reservations";
import { resolveServiceSlug } from "@/lib/service-slug";

export type BookingPageData = NonNullable<Awaited<ReturnType<typeof loadBookingPageData>>>;

export async function loadBookingPageData(slug: string, serviceSlug?: string) {
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
      bookingRouter: businesses.bookingRouter,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      payhereEnabled: businesses.payhereEnabled,
      phone: businesses.phone,
      slug: businesses.slug,
      websiteUrl: businesses.websiteUrl,
      hideDinayaBranding: businesses.hideDinayaBranding,
      accentColor: businesses.accentColor,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
    })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business || business.deletedAt) notFound();

  if (business.isSuspended) {
    return { status: "suspended" as const, business };
  }

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });

  if (!canUseFeature(effectivePlan, "publicBookingPage")) {
    return { status: "offline" as const, business };
  }

  await ensureBusinessHasDefaultLocation(business.id);
  await backfillServiceSlugsForBusiness(business.id);

  const intakeEnabled = canUseFeature(effectivePlan, "intakeForms");

  const [serviceList, staffList, reviewList, ratingData, locationList, staffLocationMap, activeDeals] =
    await Promise.all([
      db
        .select({
          id: services.id,
          businessId: services.businessId,
          name: services.name,
          slug: services.slug,
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
          maximumAdvanceDays: services.maximumAdvanceDays,
          intakeQuestions: services.intakeQuestions,
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

  const servicesWithSlugs = serviceList.map((s) => ({
    ...s,
    slug: resolveServiceSlug(s),
    intakeQuestions: intakeEnabled ? s.intakeQuestions ?? [] : [],
  }));

  const initialService = serviceSlug
    ? servicesWithSlugs.find((s) => s.slug === serviceSlug) ?? null
    : null;

  if (serviceSlug && !initialService) notFound();

  const bookingRouter = intakeEnabled
    ? resolveActiveRouter(business.bookingRouter, servicesWithSlugs.map((s) => s.id))
    : null;

  return {
    status: "ok" as const,
    business,
    effectivePlan,
    services: servicesWithSlugs,
    staff: staffList,
    staffServiceMap: assignments,
    staffLocationMap,
    locations: locationList,
    reviews: reviewList,
    avgRating: ratingData[0]?.avg ? parseFloat(ratingData[0].avg) : null,
    reviewCount: ratingData[0]?.count ?? 0,
    activeDeals,
    bookingRouter,
    initialService,
    hideBranding: Boolean(
      business.hideDinayaBranding && canUseFeature(effectivePlan, "publicBookingPageCustomization"),
    ),
    canCustomize: canUseFeature(effectivePlan, "publicBookingPageCustomization"),
  };
}
