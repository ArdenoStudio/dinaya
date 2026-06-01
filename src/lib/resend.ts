import { Resend } from "resend";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { escapeHtml, escapeHtmlAttribute } from "@/lib/html";
import { withProviderTimeout } from "@/lib/provider-timeout";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.RESEND_FROM ?? "noreply@dinaya.lk";
const COLOMBO_TZ = "Asia/Colombo";

type ResendEmailInput = Parameters<Resend["emails"]["send"]>[0];

async function sendResendEmail(input: ResendEmailInput) {
  await withProviderTimeout(getResend().emails.send(input), "Resend email send");
}

function dashboardBookingsUrl(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dinaya.lk"}/dashboard/bookings`;
}

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  businessName: string;
  businessSlug: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  bookingId: string;
}

function formatDateTime(utcDate: Date): string {
  const local = toZonedTime(utcDate, COLOMBO_TZ);
  return format(local, "EEEE, d MMMM yyyy 'at' h:mm a");
}

export async function sendBookingConfirmationToClient(data: BookingEmailData) {
  if (!data.clientEmail) return;

  await sendResendEmail({
    from: FROM,
    to: data.clientEmail,
    subject: `Booking confirmed — ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Your booking is confirmed!</h2>
        <p>Hi ${escapeHtml(data.clientName)},</p>
        <p>Your appointment has been confirmed with <strong>${escapeHtml(data.businessName)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${escapeHtml(data.serviceName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${escapeHtml(data.staffName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatDateTime(data.startsAt)}</strong></td></tr>
        </table>
        <p style="color:#666;font-size:14px">Booking reference: ${escapeHtml(data.bookingId.slice(0, 8).toUpperCase())}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Powered by <a href="https://dinaya.lk" style="color:#6366f1">Dinaya.lk</a></p>
      </div>
    `,
  });
}

export async function sendBookingReminder(data: BookingEmailData) {
  if (!data.clientEmail) return;

  await sendResendEmail({
    from: FROM,
    to: data.clientEmail,
    subject: `Reminder: your appointment tomorrow — ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">See you tomorrow! 👋</h2>
        <p>Hi ${escapeHtml(data.clientName)}, just a reminder about your appointment.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Business</td><td><strong>${escapeHtml(data.businessName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${escapeHtml(data.serviceName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${escapeHtml(data.staffName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatDateTime(data.startsAt)}</strong></td></tr>
        </table>
        <p style="color:#666;font-size:14px">Booking reference: ${escapeHtml(data.bookingId.slice(0, 8).toUpperCase())}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Powered by <a href="https://dinaya.lk" style="color:#6366f1">Dinaya.lk</a></p>
      </div>
    `,
  });
}

export async function sendBookingNotificationToBusiness(data: BookingEmailData) {
  if (!data.clientEmail) return;

  await sendResendEmail({
    from: FROM,
    to: data.clientEmail, // business email passed as clientEmail field
    subject: `New booking — ${data.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">New booking received</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Client</td><td><strong>${escapeHtml(data.clientName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${escapeHtml(data.serviceName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Staff</td><td><strong>${escapeHtml(data.staffName)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatDateTime(data.startsAt)}</strong></td></tr>
        </table>
        <a href="${escapeHtmlAttribute(dashboardBookingsUrl())}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View in Dashboard</a>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  await sendResendEmail({
    from: FROM,
    to: input.email,
    subject: "Reset your Dinaya password",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Reset your password</h2>
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>We received a request to reset the password for your Dinaya account. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtmlAttribute(input.resetUrl)}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Reset password</a>
        </p>
        <p style="color:#666;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Powered by <a href="https://dinaya.lk" style="color:#6366f1">Dinaya.lk</a></p>
      </div>
    `,
  });
}

export async function sendContactFormEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const to = process.env.CONTACT_INBOX_EMAIL ?? "hello@dinaya.lk";
  await sendResendEmail({
    from: FROM,
    to,
    replyTo: input.email,
    subject: `[Contact] ${input.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#1a1a1a">New contact form message</h2>
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
        <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;white-space:pre-wrap">${escapeHtml(input.message)}</div>
      </div>
    `,
  });
}

export async function sendStaffInviteEmail(input: {
  email: string;
  name: string;
  businessName: string;
  invitedBy: string;
  inviteUrl: string;
}) {
  await sendResendEmail({
    from: FROM,
    to: input.email,
    subject: `You're invited to join ${input.businessName} on Dinaya`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Join ${escapeHtml(input.businessName)} on Dinaya</h2>
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>${escapeHtml(input.invitedBy)} invited you to help manage bookings for <strong>${escapeHtml(input.businessName)}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtmlAttribute(input.inviteUrl)}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Accept invite</a>
        </p>
        <p style="color:#666;font-size:14px">This link expires in 7 days.</p>
      </div>
    `,
  });
}
