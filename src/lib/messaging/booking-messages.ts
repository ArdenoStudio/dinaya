import { canUseFeature, type Plan } from "@/lib/plan";
import { sendMessage } from "@/lib/messaging";
import {
  cancellationMessage,
  confirmationMessage,
  reminderMessage,
} from "@/lib/messaging/templates";
import type { BookingLanguage } from "@/lib/i18n";
import type { MessageChannel } from "@/lib/messaging/types";

type BookingMessageData = {
  businessId: string;
  bookingId: string;
  clientId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone: string;
  businessName: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  manageUrl?: string;
  plan: Plan;
  language?: BookingLanguage;
};

function channelsForPlan(plan: Plan, kind: "confirmation" | "reminder"): MessageChannel[] {
  if (kind === "confirmation") {
    if (canUseFeature(plan, "whatsappSms")) {
      return ["whatsapp", "sms", "email"];
    }
    return ["email"];
  }

  if (canUseFeature(plan, "whatsappSms")) {
    return ["whatsapp", "sms", "email"];
  }

  return ["email"];
}

export async function sendBookingConfirmationMessage(data: BookingMessageData) {
  const content = confirmationMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    startsAt: data.startsAt,
    manageUrl: data.manageUrl,
    language: data.language,
  });

  return sendMessage({
    businessId: data.businessId,
    bookingId: data.bookingId,
    clientId: data.clientId,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    feature: "confirmation",
    notificationType: "confirmation",
    idempotencyKey: `booking:${data.bookingId}:confirmation`,
    subject: content.subject,
    body: content.body,
    preferredChannels: channelsForPlan(data.plan, "confirmation"),
    meta: { html: content.html },
  });
}

export async function sendBookingReminderMessage(data: BookingMessageData) {
  const content = reminderMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    startsAt: data.startsAt,
    manageUrl: data.manageUrl,
    language: data.language,
  });

  return sendMessage({
    businessId: data.businessId,
    bookingId: data.bookingId,
    clientId: data.clientId,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    feature: "reminder_24h",
    notificationType: "reminder_24h",
    idempotencyKey: `booking:${data.bookingId}:reminder_24h`,
    subject: content.subject,
    body: content.body,
    preferredChannels: channelsForPlan(data.plan, "reminder"),
    meta: { html: content.html },
  });
}

export async function sendBookingCancellationMessage(data: Omit<BookingMessageData, "manageUrl" | "staffName"> & { staffName?: string }) {
  const content = cancellationMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    startsAt: data.startsAt,
  });

  return sendMessage({
    businessId: data.businessId,
    bookingId: data.bookingId,
    clientId: data.clientId,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    feature: "cancellation",
    notificationType: "cancellation",
    idempotencyKey: `booking:${data.bookingId}:cancellation`,
    subject: content.subject,
    body: content.body,
    preferredChannels: channelsForPlan(data.plan, "confirmation"),
  });
}
