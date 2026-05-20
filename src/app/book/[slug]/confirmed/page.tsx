import { db } from "@/db";
import { bookings, businesses, services, staff } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import ReviewPrompt from "./ReviewPrompt";

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

  const local = toZonedTime(booking.startsAt, COLOMBO_TZ);
  const isConfirmed = booking.status === "confirmed" || booking.status === "completed";
  const isPending = booking.status === "pending";

  const details = [
    { icon: "bi-tag", label: "Service", value: booking.serviceName },
    { icon: "bi-person", label: "With", value: booking.staffName },
    { icon: "bi-calendar", label: "Date", value: format(local, "d MMMM yyyy") },
    { icon: "bi-clock", label: "Time", value: format(local, "h:mm a") },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        {/* Confirmation card */}
        <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">
          <div className={`mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full border ${
            isConfirmed
              ? "bg-emerald-50 border-emerald-100"
              : "bg-amber-50 border-amber-100"
          }`}>
            <i className={`bi ${isConfirmed ? "bi-check-circle text-emerald-500" : "bi-hourglass-split text-amber-500"} text-2xl`} />
          </div>

          <h1 className="font-cal text-2xl mb-2">
            {isConfirmed ? "Booking confirmed!" : "Booking request received"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {isPending
              ? "Your slot is being held while payment or business confirmation is completed."
              : "See you at"}{" "}
            <span className="font-medium text-foreground">{booking.businessName}</span>.
          </p>

          <div className="bg-muted/30 rounded-xl p-4 text-sm text-left space-y-3 mb-6">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <i className={`bi ${d.icon} text-xs shrink-0`} />
                  <span>{d.label}</span>
                </div>
                <span className="font-medium text-right">{d.value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Ref: <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>

          <Link href={`/book/${slug}`} className="text-sm text-primary hover:underline">
            ← Back to booking page
          </Link>
        </div>

        {/* Review prompt */}
        {booking.status === "completed" && (
          <ReviewPrompt
            slug={slug}
            bookingId={booking.id}
            clientName={booking.clientName}
            businessName={booking.businessName}
          />
        )}
      </div>
    </div>
  );
}
