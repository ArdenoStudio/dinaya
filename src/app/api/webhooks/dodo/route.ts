import { type NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, payments, businesses, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmationToClient, sendBookingNotificationToBusiness } from "@/lib/resend";
import { dispatchWebhooks } from "@/lib/webhooks";

// Lazily create the handler so Webhooks() isn't called at module-load time.
// (The SDK tries to base64-decode the webhook secret at construction; doing it
// inside the request handler avoids build-time failures when the secret is a
// placeholder value.)
export async function POST(req: NextRequest) {
  const { Webhooks } = await import("@dodopayments/nextjs");

  const handler = Webhooks({
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET ?? "",

    onPaymentSucceeded: async (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (payload as any).data?.metadata as Record<string, string> | undefined;
      const bookingId = meta?.bookingId;
      if (!bookingId) return;

      // Mark payment as success
      await db
        .update(payments)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ status: "success", dodoPaymentId: (payload as any).data?.payment_id ?? null })
        .where(eq(payments.bookingId, bookingId));

      // Confirm the booking
      const [updated] = await db
        .update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (!updated) return;

      // Fire internal webhook
      void dispatchWebhooks(updated.businessId, "booking.confirmed", {
        bookingId: updated.id,
        status: "confirmed",
        clientName: updated.clientName,
        startsAt: updated.startsAt,
      });

      // Send confirmation emails
      const [[business], [service], [staffMember]] = await Promise.all([
        db.select({ name: businesses.name, email: businesses.email, slug: businesses.slug })
          .from(businesses).where(eq(businesses.id, updated.businessId)).limit(1),
        db.select({ name: services.name }).from(services).where(eq(services.id, updated.serviceId)).limit(1),
        db.select({ name: staff.name }).from(staff).where(eq(staff.id, updated.staffId)).limit(1),
      ]);

      if (!business || !service || !staffMember) return;

      await Promise.allSettled([
        updated.clientEmail
          ? sendBookingConfirmationToClient({
              clientName: updated.clientName,
              clientEmail: updated.clientEmail,
              businessName: business.name,
              businessSlug: business.slug,
              serviceName: service.name,
              staffName: staffMember.name,
              startsAt: updated.startsAt,
              bookingId: updated.id,
            })
          : Promise.resolve(),
        business.email
          ? sendBookingNotificationToBusiness({
              clientName: updated.clientName,
              clientEmail: business.email,
              businessName: business.name,
              businessSlug: business.slug,
              serviceName: service.name,
              staffName: staffMember.name,
              startsAt: updated.startsAt,
              bookingId: updated.id,
            })
          : Promise.resolve(),
      ]);
    },

    onPaymentFailed: async (payload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (payload as any).data?.metadata as Record<string, string> | undefined;
      const bookingId = meta?.bookingId;
      if (!bookingId) return;

      await db.update(payments).set({ status: "failed" }).where(eq(payments.bookingId, bookingId));
      // Leave booking as "pending" — client can retry
    },
  });

  return handler(req);
}
