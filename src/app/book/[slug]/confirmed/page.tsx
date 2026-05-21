import { db } from "@/db";
import { bookings, businesses, reviews, services, staff } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import ReviewPrompt from "./ReviewPrompt";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import { createReviewToken } from "@/lib/ai/review-links";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingConfirmedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { bookingId } = await searchParams;

  if (!bookingId) notFound();

  const [booking] = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      startsAt: bookings.startsAt,
      status: bookings.status,
      businessName: businesses.name,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .where(and(eq(bookings.id, bookingId), eq(businesses.slug, slug)))
    .limit(1);
  if (!booking) notFound();

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, booking.id))
    .limit(1);

  const local = toZonedTime(booking.startsAt, COLOMBO_TZ);
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

  const details = [
    { icon: "bi-tag", label: "Service", value: booking.serviceName },
    { icon: "bi-person", label: "With", value: booking.staffName },
    { icon: "bi-calendar", label: "Date", value: format(local, "d MMMM yyyy") },
    { icon: "bi-clock", label: "Time", value: format(local, "h:mm a") },
  ];

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#f2f2f7] px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
              isConfirmed
                ? "border-emerald-100 bg-emerald-50"
                : "border-amber-100 bg-amber-50"
            }`}
          >
            <i
              className={`bi ${isConfirmed ? "bi-check-circle text-emerald-500" : "bi-hourglass-split text-amber-500"} text-2xl`}
            />
          </div>

          <h1 className="mb-2 font-cal text-2xl text-gray-900">
            {isConfirmed ? "Booking confirmed!" : "Booking request received"}
          </h1>
          <p className="mb-8 text-sm text-gray-500">
            {isPending
              ? "Your slot is being held while payment or business confirmation is completed."
              : "See you at"}{" "}
            <span className="font-medium text-foreground">{booking.businessName}</span>.
          </p>

          <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4 text-left text-sm">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <i className={`bi ${d.icon} shrink-0 text-xs`} />
                  <span>{d.label}</span>
                </div>
                <span className="text-right font-medium">{d.value}</span>
              </div>
            ))}
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            Ref: <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>

          {(isConfirmed || isPending) && (
            <Link
              href={manageUrl}
              className="mb-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Manage your booking
            </Link>
          )}

          <Link href={`/book/${slug}`} className="text-sm text-blue-600 hover:underline">
            ← Back to booking page
          </Link>
        </div>

        {isConfirmed && !existingReview ? (
          <ReviewPrompt reviewToken={reviewToken} businessName={booking.businessName} />
        ) : null}
      </div>
    </div>
  );
}
