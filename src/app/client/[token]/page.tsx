import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { canClientRescheduleBooking, getClientBookingByToken } from "@/lib/client-booking";
import { ClientBookingManage } from "./ClientBookingManage";
import { formatBookingCopy, getBookingCopy } from "@/lib/i18n";
import type { BookingService } from "@/components/booking/BookingWizard";
import type { Staff } from "@/db/schema";

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
  if (!booking.serviceId || !booking.staffId) notFound();

  const timezone = booking.businessTimezone ?? "Asia/Colombo";
  const copy = getBookingCopy(booking.businessLanguage);
  const localStart = toZonedTime(booking.startsAt, timezone);
  const modifyCheck = canClientRescheduleBooking({
    startsAt: booking.startsAt,
    status: booking.status,
    minimumNoticeHours: booking.minimumNoticeHours,
  });

  const statusLabel =
    booking.status === "confirmed"
      ? copy.clientConfirmed
      : booking.status === "pending"
        ? copy.clientPending
        : booking.status === "cancelled"
          ? copy.clientCancelled
          : booking.status;

  const service: BookingService = {
    id: booking.serviceId,
    slug: booking.serviceSlug ?? undefined,
    imageUrl: booking.serviceImageUrl,
    afterBuffer: booking.afterBuffer,
    beforeBuffer: booking.beforeBuffer,
    businessId: booking.businessId,
    createdAt: new Date(),
    dailyCapacity: booking.dailyCapacity,
    description: booking.serviceDescription,
    durationMinutes: booking.durationMinutes,
    isActive: true,
    minimumNoticeHours: booking.minimumNoticeHours,
    maximumAdvanceDays: booking.maximumAdvanceDays,
    name: booking.serviceName,
    priceLkr: booking.priceLkr,
    requiresPayment: booking.requiresPayment,
    depositPercent: booking.depositPercent,
    intakeQuestions: [],
  };

  const staffMember: Staff = {
    id: booking.staffId,
    businessId: booking.businessId,
    name: booking.staffName,
    bio: booking.staffBio,
    avatarUrl: booking.staffAvatarUrl,
    isActive: booking.staffIsActive,
    createdAt: new Date(),
  };

  return (
    <div className="booking-page-bg flex min-h-dvh items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {copy.clientYourBooking}
          </p>
          <h1 className="font-cal text-2xl tracking-tight text-gray-900 dark:text-gray-100">{booking.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatBookingCopy(copy.clientGreeting, { name: booking.clientName })}
          </p>

          <div className="mt-6 space-y-3 rounded-xl bg-gray-50 dark:bg-neutral-900/60 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{copy.clientStatus}</span>
              <span className="font-medium capitalize">{statusLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{copy.detailService}</span>
              <span className="font-medium text-right">{booking.serviceName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{copy.detailWith}</span>
              <span className="font-medium text-right">{booking.staffName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{copy.detailDate}</span>
              <span className="font-medium text-right">{format(localStart, "d MMMM yyyy")}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{copy.detailTime}</span>
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
              businessId={booking.businessId}
              service={service}
              staff={staffMember}
              timezone={timezone}
              copy={copy}
              canModify={modifyCheck.allowed}
              modifyReason={modifyCheck.reason}
              currentStartsAt={booking.startsAt.toISOString()}
            />
          </div>

          {booking.businessPhone ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {copy.clientNeedHelp}{" "}
              <a href={`tel:${booking.businessPhone}`} className="font-medium text-primary hover:underline">
                {booking.businessPhone}
              </a>
            </p>
          ) : null}

          <div className="mt-6 border-t pt-4">
            <Link href={`/book/${booking.businessSlug}`} className="text-sm text-blue-600 hover:underline">
              {formatBookingCopy(copy.clientBookAgain, { business: booking.businessName })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
