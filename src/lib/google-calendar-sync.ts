import { addDays } from "date-fns";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, services, socialConnections, staff } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import {
  GOOGLE_PROVIDER,
  createGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from "@/lib/google-calendar";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";

type ConnectionMeta = {
  refreshTokenEncrypted?: string;
  calendarId?: string;
};

export async function syncGoogleCalendarBookings(limit = 30): Promise<number> {
  const connections = await db
    .select()
    .from(socialConnections)
    .where(and(eq(socialConnections.provider, GOOGLE_PROVIDER), eq(socialConnections.isActive, true)));

  let synced = 0;

  for (const connection of connections) {
    const [business] = await db
      .select({ plan: businesses.plan, planExpiresAt: businesses.planExpiresAt, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, connection.businessId))
      .limit(1);
    if (!business) continue;
    // Effective plan: stop syncing once a trial/paid plan has lapsed to expired.
    const plan = resolveEffectivePlan({ storedPlan: business.plan, planExpiresAt: business.planExpiresAt });
    if (!canUseFeature(plan, "googleCalendarSync")) continue;

    const meta = (connection.meta as ConnectionMeta | null) ?? {};
    const refreshToken = meta.refreshTokenEncrypted
      ? decryptSecret(meta.refreshTokenEncrypted)
      : null;
    let accessToken = connection.accessTokenEncrypted
      ? decryptSecret(connection.accessTokenEncrypted)
      : null;

    if (!accessToken && refreshToken) {
      accessToken = await refreshGoogleAccessToken(refreshToken);
      await db
        .update(socialConnections)
        .set({ accessTokenEncrypted: encryptSecret(accessToken) })
        .where(eq(socialConnections.id, connection.id));
    }
    if (!accessToken) continue;

    const upcoming = await db
      .select({
        id: bookings.id,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        clientName: bookings.clientName,
        serviceId: bookings.serviceId,
        staffId: bookings.staffId,
        googleCalendarEventId: bookings.googleCalendarEventId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, connection.businessId),
          eq(bookings.status, "confirmed"),
          isNull(bookings.googleCalendarEventId),
          gte(bookings.startsAt, new Date()),
          gte(bookings.startsAt, addDays(new Date(), -1)),
        ),
      )
      .limit(limit);

    for (const booking of upcoming) {
      const [service] = await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1);
      const [member] = await db
        .select({ name: staff.name })
        .from(staff)
        .where(eq(staff.id, booking.staffId))
        .limit(1);
      if (!service || !member) continue;

      try {
        const eventId = await createGoogleCalendarEvent({
          accessToken,
          calendarId: meta.calendarId,
          summary: `${service.name} — ${booking.clientName}`,
          description: `${business.name} · ${member.name}`,
          startsAt: new Date(booking.startsAt),
          endsAt: new Date(booking.endsAt),
        });
        await db
          .update(bookings)
          .set({ googleCalendarEventId: eventId })
          .where(eq(bookings.id, booking.id));
        synced++;
      } catch (error) {
        console.error("[google-calendar-sync] booking", booking.id, error);
      }
    }
  }

  return synced;
}
