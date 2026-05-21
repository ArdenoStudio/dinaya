import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { canClientRescheduleBooking, getClientBookingByToken } from "@/lib/client-booking";
import { ClientBookingManage } from "./ClientBookingManage";

const COLOMBO_TZ = "Asia/Colombo";

export const metadata: Metadata = {
  title: "Manage your booking | Dinaya",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClientBookingPage({ params }: Props) {
  const { token } = await params;
  const booking = await getClientBookingByToken(token);
  if (!booking) notFound();

  const localStart = toZonedTime(booking.startsAt, COLOMBO_TZ);
  const modifyCheck = canClientRescheduleBooking({
    startsAt: booking.startsAt,
    status: booking.status,
    minimumNoticeHours: booking.minimumNoticeHours,
  });

  const statusLabel =
    booking.status === "confirmed"
      ? "Confirmed"
      : booking.status === "pending"
        ? "Pending confirmation"
        : booking.status === "cancelled"
          ? "Cancelled"
          : booking.status;

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#f2f2f7] px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your booking
          </p>
          <h1 className="font-cal text-2xl tracking-tight text-gray-900">{booking.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hi {booking.clientName}, here are your appointment details.</p>

          <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{statusLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-right">{booking.serviceName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">With</span>
              <span className="font-medium text-right">{booking.staffName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-right">{format(localStart, "d MMMM yyyy")}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-right">{format(localStart, "h:mm a")}</span>
            </div>
          </div>

          {booking.cancellationPolicy ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {booking.cancellationPolicy}
            </p>
          ) : null}

          <div className="mt-6">
            <ClientBookingManage
              token={token}
              canModify={modifyCheck.allowed}
              modifyReason={modifyCheck.reason}
              currentStartsAt={booking.startsAt.toISOString()}
            />
          </div>

          {booking.businessPhone ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Need help? Call{" "}
              <a href={`tel:${booking.businessPhone}`} className="font-medium text-primary hover:underline">
                {booking.businessPhone}
              </a>
            </p>
          ) : null}

          <div className="mt-6 border-t pt-4">
            <Link href={`/book/${booking.businessSlug}`} className="text-sm text-blue-600 hover:underline">
              Book again with {booking.businessName}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
