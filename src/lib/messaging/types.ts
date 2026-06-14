import type { PlanFeature } from "@/lib/plan";
import type { WhatsAppTemplate } from "@/lib/messaging/whatsapp-templates";

export type MessageChannel = "email" | "whatsapp" | "sms";

export type BookingNotificationType =
  | "confirmation"
  | "reminder_24h"
  | "reminder_2h"
  | "cancellation";

export type MessageFeature = PlanFeature | BookingNotificationType;

export type ProviderSendResult = {
  channel: MessageChannel | "none";
  provider: string | null;
  status: "sent" | "skipped" | "failed" | "duplicate";
  providerMessageId?: string | null;
  error?: string | null;
};

export type SendMessageInput = {
  businessId: string;
  bookingId?: string | null;
  clientId?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  feature: MessageFeature;
  idempotencyKey: string;
  subject: string;
  body: string;
  preferredChannels?: MessageChannel[];
  notificationType?: BookingNotificationType;
  meta?: Record<string, unknown>;
  /** Business-initiated WhatsApp sends must use a pre-approved template. */
  whatsappTemplate?: WhatsAppTemplate;
};
