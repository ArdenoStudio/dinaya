import { db } from "@/db";
import { bookings, businesses, reviews, services, staff } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import ReviewPrompt from "./ReviewPrompt";
import PaymentStatusPoller from "./PaymentStatusPoller";
import AddToCalendar from "./AddToCalendar";
import SuccessRedirect from "./SuccessRedirect";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import { createReviewToken } from "@/lib/ai/review-links";
import { getBookingCopy } from "@/lib/i18n";
import { buildBookingShareText, buildWhatsAppShareUrl } from "@/lib/booking-share";
import { Icon } from "@/components/ui/Icon";
import { hasPublicColumn } from "@/lib/dashboard/db-compat";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingConfirmedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { bookingId } = await searchParams;

  if (!bookingId) notFound();

  const includeSuccessRedirect = await hasPublicColumn("services", "success_redirect_url");

  const [booking] = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      businessName: businesses.name,
      businessLanguage: businesses.language,
      businessTimezone: businesses.timezone,
      cancellationPolicy: businesses.cancellationPolicy,
      depositPolicy: businesses.depositPolicy,
      serviceName: services.name,
      ...(includeSuccessRedirect ? { successRedirectUrl: services.successRedirectUrl } : {}),
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .where(and(eq(bookings.id, bookingId), eq(businesses.slug, slug)))
    .limit(1);
  if (!booking) notFound();

  const copy = getBookingCopy(booking.businessLanguage);
  const timezone = booking.businessTimezone ?? "Asia/Colombo";

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, booking.id))
    .limit(1);

  const local = toZonedTime(booking.startsAt, timezone);
  const isConfirmed = booking.status === "confirmed" || booking.status === "completed";
  const isPending = booking.status === "pending";
  const reviewToken = createReviewToken({
    bookingId: booking.id,
    businessSlug: slug,
    clientName: booking.clientName,
  });

  const manageUrl = buildClientBookingUrl({
    bookingId: booking.id,
    clientPhone: booking.clientPhone,
  });

  const shareText = buildBookingShareText({
    businessName: booking.businessName,
    serviceName: booking.serviceName,
    startsAt: booking.startsAt,
    timezone,
    manageUrl,
  });
  const whatsappUrl = buildWhatsAppShareUrl(shareText);

  const successRedirectUrl = includeSuccessRedirect
    ? (booking as { successRedirectUrl?: string | null }).successRedirectUrl ?? null
    : null;

  const details = [
    { icon: "tag", label: copy.detailService, value: booking.serviceName },
    { icon: "person", label: copy.detailWith, value: booking.staffName },
    { icon: "calendar", label: copy.detailDate, value: format(local, "d MMMM yyyy") },
    { icon: "clock", label: copy.detailTime, value: format(local, "h:mm a") },
  ];

  return (
    <div className="booking-page-bg flex min-h-dvh items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm md:p-10">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
              isConfirmed
                ? "border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-amber-100 bg-amber-50 dark:bg-amber-950/40"
            }`}
          >
            <Icon
              name={isConfirmed ? "check-circle" : "hourglass-split"}
              className={isConfirmed ? "text-emerald-500 text-2xl" : "text-amber-500 text-2xl"}
            />
          </div>

          <h1 className="mb-2 text-center font-cal text-2xl text-gray-900 dark:text-gray-100">
            {isConfirmed ? copy.confirmedTitle : isPending ? copy.paymentPendingTitle : copy.requestReceivedTitle}
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isPending ? copy.paymentPendingDetail : copy.seeYouAt}{" "}
            {!isPending && (
              <span className="font-medium text-foreground">{booking.businessName}</span>
            )}
            {isPending ? null : "."}
          </p>

          {isPending ? (
            <PaymentStatusPoller bookingId={booking.id} slug={slug} copy={copy} />
          ) : null}

          {successRedirectUrl && isConfirmed ? (
            <SuccessRedirect
              redirectUrl={successRedirectUrl}
              context={{
                bookingId: booking.id,
                service: booking.serviceName,
                staff: booking.staffName,
                status: booking.status,
                startsAt: booking.startsAt.toISOString(),
              }}
              copy={copy}
            />
          ) : null}

          <div className="mb-6 space-y-3 rounded-xl bg-gray-50 dark:bg-neutral-900/60 p-4 text-left text-sm">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name={d.icon} className="shrink-0 text-xs" />
                  <span>{d.label}</span>
                </div>
                <span className="text-right font-medium">{d.value}</span>
              </div>
            ))}
          </div>

          {(booking.cancellationPolicy || booking.depositPolicy) && (
            <div className="mb-6 space-y-3 rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-left text-xs text-muted-foreground">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {copy.whatHappensNext}
              </p>
              {booking.depositPolicy ? (
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{copy.depositPolicy}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{booking.depositPolicy}</p>
                </div>
              ) : null}
              {booking.cancellationPolicy ? (
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{copy.cancellationPolicy}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{booking.cancellationPolicy}</p>
                </div>
              ) : null}
            </div>
          )}

          <AddToCalendar
            bookingId={booking.id}
            slug={slug}
            title={`${booking.serviceName} · ${booking.businessName}`}
            description={`Booking for ${booking.clientName} with ${booking.staffName}`}
            startsAt={booking.startsAt}
            endsAt={booking.endsAt}
            labels={{
              addToCalendar: copy.addToCalendar,
              downloadIcs: copy.downloadIcs,
              googleCalendar: copy.googleCalendar,
            }}
          />

          <p className="mb-4 text-center text-xs text-muted-foreground">
            {copy.refLabel}: <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>

          {(isConfirmed || isPending) && (
            <Link
              href={manageUrl}
              className="mb-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              {copy.manageBooking}
            </Link>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <Icon name="whatsapp" className="text-base" />
            {copy.shareOnWhatsApp}
          </a>

          <Link href={`/book/${slug}`} className="block text-center text-sm text-blue-600 hover:underline">
            ← {copy.backToBooking}
          </Link>
        </div>

        {isConfirmed && !existingReview ? (
          <ReviewPrompt reviewToken={reviewToken} businessName={booking.businessName} />
        ) : null}
      </div>
    </div>
  );
}
