import { db } from "@/db";
import { bookings, businesses, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingConfirmedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { bookingId } = await searchParams;

  if (!bookingId) notFound();

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) notFound();

  const [[business], [service], [staffMember]] = await Promise.all([
    db.select({ name: businesses.name }).from(businesses).where(eq(businesses.id, booking.businessId)).limit(1),
    db.select({ name: services.name }).from(services).where(eq(services.id, booking.serviceId)).limit(1),
    db.select({ name: staff.name }).from(staff).where(eq(staff.id, booking.staffId)).limit(1),
  ]);

  const local = toZonedTime(booking.startsAt, COLOMBO_TZ);

  const details = [
    { icon: "bi-tag", label: "Service", value: service.name },
    { icon: "bi-person", label: "With", value: staffMember.name },
    { icon: "bi-calendar", label: "Date", value: format(local, "d MMMM yyyy") },
    { icon: "bi-clock", label: "Time", value: format(local, "h:mm a") },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
      <div className="bg-white border rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100">
          <i className="bi bi-check-circle text-2xl text-emerald-500" />
        </div>

        <h1 className="font-cal text-2xl mb-2">Booking confirmed!</h1>
        <p className="text-muted-foreground text-sm mb-8">
          See you at <span className="font-medium text-foreground">{business.name}</span>.
        </p>

        {/* Details card */}
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

        <Link
          href={`/book/${slug}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to booking page
        </Link>
      </div>
    </div>
  );
}
