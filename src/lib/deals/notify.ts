import { and, eq, inArray } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { bookings, businesses, clients, deals, services } from "@/db/schema";
import { MAX_BROADCAST_RECIPIENTS } from "@/lib/broadcasts";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { buildDealBookingUrl } from "@/lib/deals/urls";
import { sendMessage } from "@/lib/messaging";

type DealAnnouncement = {
  id: string;
  discountPercent: number;
  apptWindowStart: Date;
  apptWindowEnd: Date;
  serviceId: string;
  serviceName: string;
  servicePriceLkr: number;
};

type BusinessAnnouncement = {
  id: string;
  name: string;
  slug: string;
};

export function buildDealAnnouncementMessage(
  deal: DealAnnouncement,
  business: BusinessAnnouncement,
): string {
  const discounted = computeDiscountedPrice(deal.servicePriceLkr, deal.discountPercent);
  const bookingUrl = buildDealBookingUrl(business.slug, deal.id);
  const windowLabel = `${format(deal.apptWindowStart, "EEE h:mm a")} – ${format(deal.apptWindowEnd, "h:mm a")}`;

  return [
    `${business.name} has a new deal: ${deal.discountPercent}% off ${deal.serviceName}.`,
    `Pay LKR ${discounted.toLocaleString("en-LK")} instead of LKR ${deal.servicePriceLkr.toLocaleString("en-LK")}.`,
    `Appointments: ${windowLabel}.`,
    `Book now: ${bookingUrl}`,
  ].join(" ");
}

async function resolvePastClientRecipients(
  businessId: string,
  serviceId: string,
): Promise<Array<{ id: string; name: string; email: string | null; phone: string | null }>> {
  const sameServiceClientIds = await db
    .selectDistinct({ clientId: bookings.clientId })
    .from(bookings)
    .where(and(
      eq(bookings.businessId, businessId),
      eq(bookings.serviceId, serviceId),
      inArray(bookings.status, ["confirmed", "completed"]),
    ));

  const clientIds = sameServiceClientIds
    .map((row) => row.clientId)
    .filter((id): id is string => Boolean(id));

  const conditions = [
    eq(clients.businessId, businessId),
    eq(clients.stage, "active"),
    eq(clients.communicationOptOut, false),
  ];

  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
    })
    .from(clients)
    .where(and(...conditions));

  const filtered = clientIds.length > 0
    ? rows.filter((row) => clientIds.includes(row.id))
    : rows;

  return filtered.slice(0, MAX_BROADCAST_RECIPIENTS);
}

export async function notifyDealAudience(input: {
  businessId: string;
  dealId: string;
  audience?: "past_clients";
}): Promise<{ recipientCount: number; sentCount: number }> {
  const [deal] = await db
    .select({
      id: deals.id,
      discountPercent: deals.discountPercent,
      apptWindowStart: deals.apptWindowStart,
      apptWindowEnd: deals.apptWindowEnd,
      serviceId: deals.serviceId,
      serviceName: services.name,
      servicePriceLkr: services.priceLkr,
    })
    .from(deals)
    .innerJoin(services, eq(services.id, deals.serviceId))
    .where(and(eq(deals.id, input.dealId), eq(deals.businessId, input.businessId)))
    .limit(1);

  if (!deal) {
    return { recipientCount: 0, sentCount: 0 };
  }

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.id, input.businessId))
    .limit(1);

  if (!business) {
    return { recipientCount: 0, sentCount: 0 };
  }

  const recipients = await resolvePastClientRecipients(input.businessId, deal.serviceId);
  const body = buildDealAnnouncementMessage(deal, business);
  let sentCount = 0;

  for (const recipient of recipients) {
    const messagingResult = await sendMessage({
      businessId: input.businessId,
      clientId: recipient.id,
      clientEmail: recipient.email,
      clientPhone: recipient.phone,
      feature: "whatsappSms",
      idempotencyKey: `deal:${input.dealId}:${recipient.id}`,
      subject: `${business.name} — ${deal.discountPercent}% off ${deal.serviceName}`,
      body,
      preferredChannels: ["whatsapp", "sms"],
    });

    if (messagingResult.status === "sent") {
      sentCount += 1;
      continue;
    }

    if (recipient.email) {
      const emailResult = await sendMessage({
        businessId: input.businessId,
        clientId: recipient.id,
        clientEmail: recipient.email,
        clientPhone: recipient.phone,
        feature: "whatsappSms",
        idempotencyKey: `deal:${input.dealId}:${recipient.id}:email`,
        subject: `${business.name} — ${deal.discountPercent}% off ${deal.serviceName}`,
        body,
        preferredChannels: ["email"],
      });
      if (emailResult.status === "sent") sentCount += 1;
    }
  }

  return { recipientCount: recipients.length, sentCount };
}
