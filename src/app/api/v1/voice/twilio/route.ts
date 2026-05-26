import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, voiceIntegrations } from "@/db/schema";

/**
 * Twilio inbound voice webhook (Phase 2 foundation).
 * Configure a Twilio number voice URL to POST here with ?businessId=<uuid>.
 * Returns ConversationRelay TwiML when TWILIO_CONVERSATION_RELAY_WS_URL is set.
 */
export async function POST(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return twimlResponse("<Response><Say language=\"en-IN\">Service unavailable.</Say></Response>", 400);
  }

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return twimlResponse("<Response><Say language=\"en-IN\">Business not found.</Say></Response>", 404);
  }

  const [integration] = await db
    .select({ welcomeMessage: voiceIntegrations.welcomeMessage, fallbackMessage: voiceIntegrations.fallbackMessage })
    .from(voiceIntegrations)
    .where(eq(voiceIntegrations.businessId, businessId))
    .limit(1);

  const relayWs = process.env.TWILIO_CONVERSATION_RELAY_WS_URL;
  if (relayWs) {
    const welcome = integration?.welcomeMessage ?? `Welcome to ${business.name}. How can I help you book today?`;
    const xml = [
      "<Response>",
      "<Connect>",
      `<ConversationRelay url="${escapeXml(relayWs)}" welcomeGreeting="${escapeXml(welcome)}" />`,
      "</Connect>",
      "</Response>",
    ].join("");
    return twimlResponse(xml);
  }

  const fallback = integration?.fallbackMessage
    ?? "Our AI receptionist is being configured. Please call back shortly or book online.";
  return twimlResponse(`<Response><Say language="en-IN">${escapeXml(fallback)}</Say></Response>`);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
