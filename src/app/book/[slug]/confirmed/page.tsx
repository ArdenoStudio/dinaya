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

  const dateLine = format(local, "EEEE, d MMMM");
  const timeLine = format(local, "h:mm a");

  return (
    <div className="booking-page-bg flex min-h-dvh items-start justify-center px-4 py-10 md:py-14">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-4 flex justify-center">
            <div
              className={`flex size-12 items-center justify-center rounded-full ${
                isConfirmed
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Icon
                name={isConfirmed ? "check-lg" : "hourglass-split"}
                className="text-xl"
              />
            </div>
          </div>

          <h1 className="text-center text-xl font-semibold text-foreground md:text-2xl">
            {isConfirmed ? copy.confirmedTitle : isPending ? copy.paymentPendingTitle : copy.requestReceivedTitle}
          </h1>

          {!isPending ? (
            <div className="mt-5 text-center">
              <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {timeLine}
              </p>
              <p className="mt-1 text-base text-muted-foreground">{dateLine}</p>
              <p className="mt-3 text-sm text-foreground">
                {booking.serviceName}
                <span className="text-muted-foreground"> · {booking.businessName}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.detailWith} {booking.staffName}</p>
            </div>
          ) : (
            <p className="mt-3 text-center text-sm text-muted-foreground">{copy.paymentPendingDetail}</p>
          )}

          {isPending ? (
            <div className="mt-4">
              <PaymentStatusPoller bookingId={booking.id} slug={slug} copy={copy} />
            </div>
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

          {(booking.cancellationPolicy || booking.depositPolicy) && !isPending && (
            <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-left text-xs text-muted-foreground">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.whatHappensNext}
              </p>
              {booking.depositPolicy ? (
                <div>
                  <p className="font-medium text-foreground">{copy.depositPolicy}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{booking.depositPolicy}</p>
                </div>
              ) : null}
              {booking.cancellationPolicy ? (
                <div>
                  <p className="font-medium text-foreground">{copy.cancellationPolicy}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{booking.cancellationPolicy}</p>
                </div>
              ) : null}
            </div>
          )}

          {!isPending && (
            <div className="mt-6">
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
            </div>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {copy.refLabel}: <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>

          {(isConfirmed || isPending) && (
            <Link
              href={manageUrl}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {copy.manageBooking}
            </Link>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="whatsapp" className="text-base text-emerald-600" />
            {copy.shareOnWhatsApp}
          </a>

          <Link
            href={`/book/${slug}`}
            className="mt-4 block text-center text-sm text-[var(--booking-accent)] hover:underline"
          >
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
