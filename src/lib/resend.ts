import { Resend } from "resend";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.RESEND_FROM ?? "noreply@dinaya.lk";
const COLOMBO_TZ = "Asia/Colombo";

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

  await getResend().emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `Booking confirmed — ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">Your booking is confirmed!</h2>
        <p>Hi ${data.clientName},</p>
        <p>Your appointment has been confirmed with <strong>${data.businessName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${data.serviceName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${data.staffName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatDateTime(data.startsAt)}</strong></td></tr>
        </table>
        <p style="color:#666;font-size:14px">Booking reference: ${data.bookingId.slice(0, 8).toUpperCase()}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Powered by <a href="https://dinaya.lk" style="color:#6366f1">Dinaya.lk</a></p>
      </div>
    `,
  });
}

export async function sendBookingNotificationToBusiness(data: BookingEmailData) {
  if (!data.clientEmail) return;

  await getResend().emails.send({
    from: FROM,
    to: data.clientEmail, // business email passed as clientEmail field
    subject: `New booking — ${data.clientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#1a1a1a">New booking received</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#666">Client</td><td><strong>${data.clientName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${data.serviceName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Staff</td><td><strong>${data.staffName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Date & Time</td><td><strong>${formatDateTime(data.startsAt)}</strong></td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View in Dashboard</a>
      </div>
    `,
  });
}
