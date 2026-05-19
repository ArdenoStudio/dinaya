import { format } from "date-fns";
import { toWhatsAppPhone } from "@/lib/phone";

type BookingMessageInput = {
  businessName?: string | null;
  clientName: string;
  serviceName: string;
  startsAt: Date | string;
};

function formatAppointment(startsAt: Date | string) {
  return format(new Date(startsAt), "d MMM 'at' h:mm a");
}

export function bookingReminderText(input: BookingMessageInput) {
  const business = input.businessName ? ` at ${input.businessName}` : "";
  return `Hi ${input.clientName}, reminder: your ${input.serviceName} appointment${business} is on ${formatAppointment(input.startsAt)}. Reply here if you need to reschedule.`;
}

export function bookingConfirmationText(input: BookingMessageInput) {
  const business = input.businessName ? ` at ${input.businessName}` : "";
  return `Hi ${input.clientName}, your ${input.serviceName} booking${business} is confirmed for ${formatAppointment(input.startsAt)}.`;
}

export function whatsappUrl(phone: string, text: string) {
  return `https://wa.me/${toWhatsAppPhone(phone)}?text=${encodeURIComponent(text)}`;
}
