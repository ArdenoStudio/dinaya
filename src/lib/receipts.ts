import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { sendEmail } from "@/lib/messaging/channels/email";
import { formatLkr } from "@/lib/utils";

const COLOMBO_TZ = "Asia/Colombo";

export type PaymentReceiptData = {
  clientName: string;
  clientEmail: string;
  businessName: string;
  businessEmail?: string | null;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  amountLkr: number;
  orderId: string;
  paymentId: string;
  manageUrl?: string;
};

function receiptHtml(data: PaymentReceiptData): string {
  const when = format(toZonedTime(data.startsAt, COLOMBO_TZ), "EEEE, d MMMM yyyy 'at' h:mm a");
  const paidAt = format(toZonedTime(new Date(), COLOMBO_TZ), "d MMMM yyyy, h:mm a");

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1a1a1a">Payment receipt</h2>
      <p>Hi ${data.clientName},</p>
      <p>Thank you for your payment to <strong>${data.businessName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Receipt</td><td><strong>${data.paymentId.slice(0, 8).toUpperCase()}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Order ID</td><td><strong>${data.orderId}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Service</td><td><strong>${data.serviceName}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">With</td><td><strong>${data.staffName}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Appointment</td><td><strong>${when}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Amount paid</td><td><strong>${formatLkr(data.amountLkr)}</strong></td></tr>
        <tr><td style="padding:8px 0;color:#666">Paid on</td><td><strong>${paidAt}</strong></td></tr>
      </table>
      ${data.manageUrl ? `<p><a href="${data.manageUrl}" style="color:#6366f1">Manage your booking</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px">This receipt was issued by ${data.businessName} via Dinaya.lk</p>
    </div>
  `;
}

export async function sendPaymentReceiptEmail(data: PaymentReceiptData) {
  if (!data.clientEmail) {
    return { status: "skipped" as const, error: "No client email." };
  }

  const when = format(toZonedTime(data.startsAt, COLOMBO_TZ), "d MMM yyyy, h:mm a");
  const subject = `Receipt — ${formatLkr(data.amountLkr)} paid to ${data.businessName}`;
  const body = `Hi ${data.clientName}, receipt for ${formatLkr(data.amountLkr)} paid to ${data.businessName} for ${data.serviceName} on ${when}. Order: ${data.orderId}.`;

  return sendEmail({
    clientEmail: data.clientEmail,
    subject,
    body,
    html: receiptHtml(data),
  });
}
