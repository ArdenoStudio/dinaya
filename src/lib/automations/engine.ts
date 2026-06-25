import { addMinutes } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  automationRules,
  automationRuns,
  bookings,
  businesses,
  services,
  staff,
} from "@/db/schema";
import { buildReviewUrl } from "@/lib/ai/review-links";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import {
  sendBookingConfirmationMessage,
  sendBookingReminderMessage,
} from "@/lib/messaging/booking-messages";
import { sendMessage } from "@/lib/messaging";
import { canUseFeature, getBusinessPlan, type Plan } from "@/lib/plan";
import type { BookingLanguage } from "@/lib/i18n";

const AUTOMATION_TRIGGER_VERSION = "v1";

type AutomationAction = {
  type: string;
  template?: string;
};

function parseActions(raw: unknown): AutomationAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is AutomationAction => Boolean(item && typeof item === "object"));
}

async function loadBookingContext(bookingId: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      startsAt: bookings.startsAt,
      status: bookings.status,
      serviceName: services.name,
      staffName: staff.name,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessPlan: businesses.plan,
      businessLanguage: businesses.language,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return row ?? null;
}

async function executeAutomationAction(input: {
  ruleId: string;
  bookingId: string;
  action: AutomationAction;
}): Promise<{ ok: boolean; error?: string }> {
  const booking = await loadBookingContext(input.bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };

  const manageUrl = buildClientBookingUrl({
    bookingId: booking.id,
    clientPhone: booking.clientPhone,
  });

  const messageBase = {
    businessId: booking.businessId,
    bookingId: booking.id,
    clientId: booking.clientId,
    clientName: booking.clientName,
    clientEmail: booking.clientEmail,
    clientPhone: booking.clientPhone,
    businessName: booking.businessName,
    serviceName: booking.serviceName,
    staffName: booking.staffName,
    startsAt: booking.startsAt,
    manageUrl,
    plan: booking.businessPlan as Plan,
    language: booking.businessLanguage as BookingLanguage,
  };

  switch (input.action.template) {
    case "appointment_reminder_24h":
      await sendBookingReminderMessage(messageBase);
      return { ok: true };
    case "booking_confirmation":
      await sendBookingConfirmationMessage(messageBase);
      return { ok: true };
    case "review_request": {
      const reviewUrl = buildReviewUrl({
        bookingId: booking.id,
        businessSlug: booking.businessSlug,
        clientName: booking.clientName,
      });
      await sendMessage({
        businessId: booking.businessId,
        bookingId: booking.id,
        clientId: booking.clientId,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        feature: "reviewEngine",
        idempotencyKey: `automation:${input.ruleId}:review:${booking.id}`,
        subject: `How was your visit at ${booking.businessName}?`,
        body: `Hi ${booking.clientName}, thanks for visiting ${booking.businessName}. Leave a quick review: ${reviewUrl}`,
        preferredChannels: canUseFeature(booking.businessPlan as Plan, "whatsappSms")
          ? ["whatsapp", "sms", "email"]
          : ["email"],
      });
      return { ok: true };
    }
    case "no_show_follow_up": {
      await sendMessage({
        businessId: booking.businessId,
        bookingId: booking.id,
        clientId: booking.clientId,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        feature: "automations",
        idempotencyKey: `automation:${input.ruleId}:no_show:${booking.id}`,
        subject: `Missed your appointment — ${booking.businessName}`,
        body: `Hi ${booking.clientName}, we missed you at ${booking.businessName}. Rebook when you're ready: ${manageUrl}`,
        preferredChannels: canUseFeature(booking.businessPlan as Plan, "whatsappSms")
          ? ["whatsapp", "sms", "email"]
          : ["email"],
      });
      return { ok: true };
    }
    default:
      return { ok: false, error: `Unknown automation template: ${input.action.template ?? "none"}` };
  }
}

async function markRun(input: {
  ruleId: string;
  bookingId: string;
  triggerVersion: string;
  status: "completed" | "failed";
  error?: string;
}) {
  await db
    .update(automationRuns)
    .set({
      status: input.status,
      error: input.error ?? null,
    })
    .where(and(
      eq(automationRuns.ruleId, input.ruleId),
      eq(automationRuns.entityId, input.bookingId),
      eq(automationRuns.triggerVersion, input.triggerVersion),
    ));
}

async function queueOrRunRule(input: {
  rule: typeof automationRules.$inferSelect;
  bookingId: string;
}) {
  const triggerVersion = AUTOMATION_TRIGGER_VERSION;

  if (input.rule.delayMinutes > 0) {
    await db
      .insert(automationRuns)
      .values({
        ruleId: input.rule.id,
        entityId: input.bookingId,
        triggerVersion,
        status: "pending",
      })
      .onConflictDoNothing({
        target: [automationRuns.ruleId, automationRuns.entityId, automationRuns.triggerVersion],
      });
    return;
  }

  const [createdRun] = await db
    .insert(automationRuns)
    .values({
      ruleId: input.rule.id,
      entityId: input.bookingId,
      triggerVersion,
      status: "running",
    })
    .onConflictDoNothing({
      target: [automationRuns.ruleId, automationRuns.entityId, automationRuns.triggerVersion],
    })
    .returning({ id: automationRuns.id });

  if (!createdRun) {
    return;
  }

  const actions = parseActions(input.rule.actions);
  for (const action of actions) {
    const result = await executeAutomationAction({
      ruleId: input.rule.id,
      bookingId: input.bookingId,
      action,
    });
    if (!result.ok) {
      await markRun({
        ruleId: input.rule.id,
        bookingId: input.bookingId,
        triggerVersion,
        status: "failed",
        error: result.error,
      });
      return;
    }
  }

  await markRun({
    ruleId: input.rule.id,
    bookingId: input.bookingId,
    triggerVersion,
    status: "completed",
  });
}

export async function processBookingAutomationTrigger(
  businessId: string,
  bookingId: string,
  trigger: string,
): Promise<void> {
  // Effective plan: a lapsed trial / expired business must not run automations,
  // even though its stored plan still reads "trial"/"pro"/"max" until billing.
  const plan = await getBusinessPlan(businessId);
  if (!canUseFeature(plan, "automations")) {
    return;
  }

  const rules = await db
    .select()
    .from(automationRules)
    .where(and(
      eq(automationRules.businessId, businessId),
      eq(automationRules.trigger, trigger),
      eq(automationRules.isActive, true),
    ));

  for (const rule of rules) {
    await queueOrRunRule({ rule, bookingId });
  }
}

export async function processDueAutomationRuns(): Promise<{ processed: number; failed: number }> {
  const pendingRuns = await db
    .select({
      runId: automationRuns.id,
      bookingId: automationRuns.entityId,
      createdAt: automationRuns.createdAt,
      triggerVersion: automationRuns.triggerVersion,
      ruleId: automationRules.id,
      delayMinutes: automationRules.delayMinutes,
      actions: automationRules.actions,
      businessId: automationRules.businessId,
    })
    .from(automationRuns)
    .innerJoin(automationRules, eq(automationRules.id, automationRuns.ruleId))
    .where(and(
      eq(automationRuns.status, "pending"),
      eq(automationRules.isActive, true),
    ));

  let processed = 0;
  let failed = 0;

  for (const run of pendingRuns) {
    const dueAt = addMinutes(run.createdAt, run.delayMinutes);
    if (dueAt.getTime() > Date.now()) continue;

    await db
      .update(automationRuns)
      .set({ status: "running" })
      .where(eq(automationRuns.id, run.runId));

    const actions = parseActions(run.actions);
    let runFailed = false;

    for (const action of actions) {
      const result = await executeAutomationAction({
        ruleId: run.ruleId,
        bookingId: run.bookingId,
        action,
      });
      if (!result.ok) {
        runFailed = true;
        await markRun({
          ruleId: run.ruleId,
          bookingId: run.bookingId,
          triggerVersion: run.triggerVersion,
          status: "failed",
          error: result.error,
        });
        failed++;
        break;
      }
    }

    if (!runFailed) {
      await markRun({
        ruleId: run.ruleId,
        bookingId: run.bookingId,
        triggerVersion: run.triggerVersion,
        status: "completed",
      });
      processed++;
    }
  }

  return { processed, failed };
}
