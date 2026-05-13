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

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
      <div className="bg-white border rounded-xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-cal text-2xl mb-2">Booking confirmed!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          See you at {business.name}.
        </p>

        <div className="bg-muted/30 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">With</span>
            <span className="font-medium">{staffMember.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{format(local, "d MMMM yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{format(local, "h:mm a")}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Ref: {booking.id.slice(0, 8).toUpperCase()}
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
