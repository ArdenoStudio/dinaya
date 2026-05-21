import { addMinutes } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  automationRules,
  automationRuns,
  bookings,
  businesses,
  services,
  staff,
} from "@/db/schema";
import { sendBookingReminder } from "@/lib/resend";
import { canUseFeature, type Plan } from "@/lib/plan";

type AutomationAction = { type?: string; template?: string };

export async function runAutomationRules(): Promise<{ processed: number; sent: number }> {
  const rules = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.isActive, true));

  let processed = 0;
  let sent = 0;

  for (const rule of rules) {
    const [business] = await db
      .select({ plan: businesses.plan, name: businesses.name, slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.id, rule.businessId))
      .limit(1);
    if (!business || !canUseFeature(business.plan as Plan, "automations")) continue;

    const actions = Array.isArray(rule.actions) ? (rule.actions as AutomationAction[]) : [];
    const emailAction = actions.find((action) => action.type === "send_email");
    if (!emailAction) continue;

    const statusMap: Record<string, string> = {
      "booking.confirmed": "confirmed",
      "booking.completed": "completed",
      "booking.no_show": "no_show",
    };
    const bookingStatus = statusMap[rule.trigger];
    if (!bookingStatus) continue;

    const since = addMinutes(new Date(), -(rule.delayMinutes + 60));
    const until = addMinutes(new Date(), -rule.delayMinutes);

    const candidates = await db
      .select({
        id: bookings.id,
        clientName: bookings.clientName,
        clientEmail: bookings.clientEmail,
        startsAt: bookings.startsAt,
        serviceId: bookings.serviceId,
        staffId: bookings.staffId,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, rule.businessId),
          eq(bookings.status, bookingStatus as "confirmed" | "completed" | "no_show"),
          gte(bookings.createdAt, since),
          lte(bookings.createdAt, until),
        ),
      )
      .limit(25);

    for (const booking of candidates) {
      processed++;
      if (!booking.clientEmail) continue;

      const [existingRun] = await db
        .select({ id: automationRuns.id })
        .from(automationRuns)
        .where(and(eq(automationRuns.ruleId, rule.id), eq(automationRuns.entityId, booking.id)))
        .limit(1);
      if (existingRun) continue;

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
        if (emailAction.template === "appointment_reminder_24h") {
          await sendBookingReminder({
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service.name,
            staffName: member.name,
            startsAt: new Date(booking.startsAt),
            bookingId: booking.id,
          });
        }

        await db.insert(automationRuns).values({
          ruleId: rule.id,
          entityId: booking.id,
          status: "completed",
        });
        sent++;
      } catch (error) {
        await db.insert(automationRuns).values({
          ruleId: rule.id,
          entityId: booking.id,
          status: "failed",
          error: error instanceof Error ? error.message : "automation_failed",
        });
      }
    }
  }

  return { processed, sent };
}
