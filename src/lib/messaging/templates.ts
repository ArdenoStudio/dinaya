import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingLanguage } from "@/lib/i18n";
import { escapeHtml, escapeHtmlAttribute } from "@/lib/html";

const COLOMBO_TZ = "Asia/Colombo";

export function formatBookingDateTime(startsAt: Date): string {
  const local = toZonedTime(startsAt, COLOMBO_TZ);
  return format(local, "EEEE, d MMMM yyyy 'at' h:mm a");
}

export function formatBookingDateShort(startsAt: Date): string {
  const local = toZonedTime(startsAt, COLOMBO_TZ);
  return format(local, "d MMM h:mm a");
}

type BookingMessageContext = {
  clientName: string;
  businessName: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  manageUrl?: string;
  language?: BookingLanguage;
};

export function confirmationEmailHtml(ctx: BookingMessageContext): string {
  const clientName = escapeHtml(ctx.clientName);
  const businessName = escapeHtml(ctx.businessName);
  const serviceName = escapeHtml(ctx.serviceName);
  const staffName = escapeHtml(ctx.staffName);
  const manageBlock = ctx.manageUrl
    ? `<p style="margin:16px 0"><a href="${escapeHtmlAttribute(ctx.manageUrl)}" style="color:#6366f1">Manage your booking</a></p>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#1a1a1a">Your booking is confirmed!</h2>
      <p>Hi ${clientName},</p>
      <p>Your appointment has been confirmed with <strong>${businessName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${serviceName}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${staffName}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatBookingDateTime(ctx.startsAt)}</strong></td></tr>
      </table>
      ${manageBlock}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px">Powered by <a href="https://dinaya.lk" style="color:#6366f1">Dinaya.lk</a></p>
    </div>
  `;
}

export function confirmationMessage(ctx: BookingMessageContext): { subject: string; body: string; html: string } {
  const when = formatBookingDateTime(ctx.startsAt);
  const manageLine = ctx.manageUrl ? `\nManage: ${ctx.manageUrl}` : "";

  return {
    subject: `Booking confirmed — ${ctx.businessName}`,
    body: `Hi ${ctx.clientName}, your ${ctx.serviceName} appointment with ${ctx.businessName} is confirmed for ${when}.${manageLine}`,
    html: confirmationEmailHtml(ctx),
  };
}

export function reminderMessage(ctx: BookingMessageContext): { subject: string; body: string; html: string } {
  const when = formatBookingDateTime(ctx.startsAt);
  const manageLine = ctx.manageUrl ? `\nManage: ${ctx.manageUrl}` : "";
  const clientName = escapeHtml(ctx.clientName);
  const businessName = escapeHtml(ctx.businessName);
  const serviceName = escapeHtml(ctx.serviceName);
  const staffName = escapeHtml(ctx.staffName);

  return {
    subject: `Reminder: your appointment — ${ctx.businessName}`,
    body: `Hi ${ctx.clientName}, reminder for your ${ctx.serviceName} appointment at ${ctx.businessName} on ${when}.${manageLine}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Appointment reminder</h2>
        <p>Hi ${clientName},</p>
        <p>This is a reminder about your upcoming appointment with <strong>${businessName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${serviceName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${staffName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${when}</strong></td></tr>
        </table>
        ${ctx.manageUrl ? `<p><a href="${escapeHtmlAttribute(ctx.manageUrl)}" style="color:#6366f1">Manage your booking</a></p>` : ""}
      </div>
    `,
  };
}

export function cancellationMessage(ctx: Pick<BookingMessageContext, "clientName" | "businessName" | "serviceName" | "startsAt">): {
  subject: string;
  body: string;
} {
  const when = formatBookingDateTime(ctx.startsAt);
  return {
    subject: `Booking cancelled — ${ctx.businessName}`,
    body: `Hi ${ctx.clientName}, your ${ctx.serviceName} appointment at ${ctx.businessName} on ${when} has been cancelled.`,
  };
}

export function rescheduleMessage(ctx: BookingMessageContext): { subject: string; body: string; html: string } {
  const when = formatBookingDateTime(ctx.startsAt);
  const manageLine = ctx.manageUrl ? `\nManage: ${ctx.manageUrl}` : "";
  const clientName = escapeHtml(ctx.clientName);
  const businessName = escapeHtml(ctx.businessName);
  const serviceName = escapeHtml(ctx.serviceName);
  const staffName = escapeHtml(ctx.staffName);

  return {
    subject: `Booking rescheduled — ${ctx.businessName}`,
    body: `Hi ${ctx.clientName}, your ${ctx.serviceName} appointment with ${ctx.businessName} has been moved to ${when}.${manageLine}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Your booking was rescheduled</h2>
        <p>Hi ${clientName},</p>
        <p>Your appointment with <strong>${businessName}</strong> has a new time.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${serviceName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${staffName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">New date & time</td><td><strong>${when}</strong></td></tr>
        </table>
        ${ctx.manageUrl ? `<p><a href="${escapeHtmlAttribute(ctx.manageUrl)}" style="color:#6366f1">Manage your booking</a></p>` : ""}
      </div>
    `,
  };
}
