import type { BookingLanguage } from "@/lib/i18n";

type MessageKey =
  | "confirmationSms"
  | "reminderSms"
  | "cancellationSms"
  | "rescheduleSms";

const messages: Record<BookingLanguage, Record<MessageKey, (ctx: {
  clientName: string;
  businessName: string;
  serviceName: string;
  when: string;
  manageUrl?: string;
}) => string>> = {
  en: {
    confirmationSms: ({ clientName, businessName, serviceName, when, manageUrl }) =>
      `Hi ${clientName}, your ${serviceName} at ${businessName} is confirmed for ${when}.${manageUrl ? ` Manage: ${manageUrl}` : ""}`,
    reminderSms: ({ clientName, businessName, serviceName, when, manageUrl }) =>
      `Reminder: ${serviceName} at ${businessName} on ${when}.${manageUrl ? ` Manage: ${manageUrl}` : ""}`,
    cancellationSms: ({ clientName, businessName, serviceName, when }) =>
      `Hi ${clientName}, your ${serviceName} at ${businessName} on ${when} has been cancelled.`,
    rescheduleSms: ({ clientName, businessName, serviceName, when, manageUrl }) =>
      `Hi ${clientName}, your ${serviceName} at ${businessName} is now on ${when}.${manageUrl ? ` Manage: ${manageUrl}` : ""}`,
  },
  si: {
    confirmationSms: ({ clientName, businessName, when, manageUrl }) =>
      `${clientName}, ${businessName} වෙත ${when} දිනයේ වේලාව සනාථයි.${manageUrl ? ` ${manageUrl}` : ""}`,
    reminderSms: ({ businessName, when, manageUrl }) =>
      `මතක් කිරීම: ${businessName} - ${when}.${manageUrl ? ` ${manageUrl}` : ""}`,
    cancellationSms: ({ clientName, businessName, when }) =>
      `${clientName}, ${businessName} වෙත ${when} දිනයේ වේලාව එපා කර ඇත.`,
    rescheduleSms: ({ clientName, businessName, when, manageUrl }) =>
      `${clientName}, ${businessName} වේලාව ${when} දක්වා වෙනස් කර ඇත.${manageUrl ? ` ${manageUrl}` : ""}`,
  },
  ta: {
    confirmationSms: ({ clientName, businessName, when, manageUrl }) =>
      `${clientName}, ${businessName} - ${when} நேரம் உறுதிசெய்யப்பட்டது.${manageUrl ? ` ${manageUrl}` : ""}`,
    reminderSms: ({ businessName, when, manageUrl }) =>
      `நினைவூட்டல்: ${businessName} - ${when}.${manageUrl ? ` ${manageUrl}` : ""}`,
    cancellationSms: ({ clientName, businessName, when }) =>
      `${clientName}, ${businessName} - ${when} நேரம் ரத்து செய்யப்பட்டது.`,
    rescheduleSms: ({ clientName, businessName, when, manageUrl }) =>
      `${clientName}, ${businessName} நேரம் ${when} ஆக மாற்றப்பட்டது.${manageUrl ? ` ${manageUrl}` : ""}`,
  },
};

export function localizedSmsBody(
  language: BookingLanguage | undefined,
  key: MessageKey,
  ctx: {
    clientName: string;
    businessName: string;
    serviceName: string;
    when: string;
    manageUrl?: string;
  },
): string {
  const locale = language === "si" || language === "ta" ? language : "en";
  return messages[locale][key](ctx);
}
