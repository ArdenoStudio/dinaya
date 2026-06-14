import { canUseFeature, type Plan } from "@/lib/plan";
import { sendMessage } from "@/lib/messaging";
import {
  cancellationMessage,
  confirmationMessage,
  formatBookingDateShort,
  reminderMessage,
  rescheduleMessage,
} from "@/lib/messaging/templates";
import { localizedSmsBody } from "@/lib/messaging/locale";
import { buildWhatsAppTemplate, WHATSAPP_TEMPLATES } from "@/lib/messaging/whatsapp-templates";
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
  const whenShort = formatBookingDateShort(data.startsAt);
  const content = confirmationMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    startsAt: data.startsAt,
    manageUrl: data.manageUrl,
    language: data.language,
  });
  const smsBody = localizedSmsBody(data.language, "confirmationSms", {
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    when: whenShort,
    manageUrl: data.manageUrl,
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
    body: smsBody,
    preferredChannels: channelsForPlan(data.plan, "confirmation"),
    whatsappTemplate: buildWhatsAppTemplate(WHATSAPP_TEMPLATES.confirmation, data.language, [
      data.clientName,
      data.businessName,
      data.serviceName,
      whenShort,
      data.manageUrl,
    ]),
    meta: { html: content.html, emailText: content.body },
  });
}

export async function sendBookingReminderMessage(data: BookingMessageData) {
  const whenShort = formatBookingDateShort(data.startsAt);
  const content = reminderMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    startsAt: data.startsAt,
    manageUrl: data.manageUrl,
    language: data.language,
  });
  const smsBody = localizedSmsBody(data.language, "reminderSms", {
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    when: whenShort,
    manageUrl: data.manageUrl,
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
    body: smsBody,
    preferredChannels: channelsForPlan(data.plan, "reminder"),
    whatsappTemplate: buildWhatsAppTemplate(WHATSAPP_TEMPLATES.reminder, data.language, [
      data.clientName,
      data.businessName,
      data.serviceName,
      whenShort,
      data.manageUrl,
    ]),
    meta: { html: content.html, emailText: content.body },
  });
}

export async function sendBookingCancellationMessage(data: Omit<BookingMessageData, "manageUrl" | "staffName"> & { staffName?: string }) {
  const whenShort = formatBookingDateShort(data.startsAt);
  const content = cancellationMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    startsAt: data.startsAt,
  });
  const smsBody = localizedSmsBody(data.language, "cancellationSms", {
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    when: whenShort,
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
    body: smsBody,
    preferredChannels: channelsForPlan(data.plan, "confirmation"),
    whatsappTemplate: buildWhatsAppTemplate(WHATSAPP_TEMPLATES.cancellation, data.language, [
      data.clientName,
      data.businessName,
      data.serviceName,
      whenShort,
    ]),
    meta: { emailText: content.body },
  });
}

export async function sendBookingRescheduleMessage(data: BookingMessageData) {
  const whenShort = formatBookingDateShort(data.startsAt);
  const content = rescheduleMessage({
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    staffName: data.staffName,
    startsAt: data.startsAt,
    manageUrl: data.manageUrl,
    language: data.language,
  });
  const smsBody = localizedSmsBody(data.language, "rescheduleSms", {
    clientName: data.clientName,
    businessName: data.businessName,
    serviceName: data.serviceName,
    when: whenShort,
    manageUrl: data.manageUrl,
  });

  return sendMessage({
    businessId: data.businessId,
    bookingId: data.bookingId,
    clientId: data.clientId,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    feature: "confirmation",
    idempotencyKey: `booking:${data.bookingId}:reschedule:${data.startsAt.toISOString()}`,
    subject: content.subject,
    body: smsBody,
    preferredChannels: channelsForPlan(data.plan, "confirmation"),
    whatsappTemplate: buildWhatsAppTemplate(WHATSAPP_TEMPLATES.reschedule, data.language, [
      data.clientName,
      data.businessName,
      data.serviceName,
      whenShort,
      data.manageUrl,
    ]),
    meta: { html: content.html, emailText: content.body },
  });
}

type BusinessNotificationData = {
  businessId: string;
  bookingId: string;
  businessPhone: string;
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  plan: Plan;
};

export async function sendBookingNotificationToBusinessMessage(data: BusinessNotificationData) {
  const whenShort = formatBookingDateShort(data.startsAt);
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dinaya.lk"}/dashboard/bookings`;
  const body = `New booking at ${data.businessName}: ${data.clientName} — ${data.serviceName} with ${data.staffName} on ${whenShort}. View: ${dashboardUrl}`;

  const channels: MessageChannel[] = canUseFeature(data.plan, "whatsappSms")
    ? ["whatsapp", "sms"]
    : ["sms"];

  return sendMessage({
    businessId: data.businessId,
    bookingId: data.bookingId,
    clientPhone: data.businessPhone,
    feature: "confirmation",
    notificationType: "confirmation",
    idempotencyKey: `booking:${data.bookingId}:owner-notification`,
    subject: `New booking — ${data.clientName}`,
    body,
    preferredChannels: channels,
    whatsappTemplate: buildWhatsAppTemplate(WHATSAPP_TEMPLATES.ownerNewBooking, undefined, [
      data.businessName,
      data.clientName,
      data.serviceName,
      data.staffName,
      whenShort,
      dashboardUrl,
    ]),
  });
}
