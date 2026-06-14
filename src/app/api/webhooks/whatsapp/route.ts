import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { handleInboundWhatsApp } from "@/lib/messaging/inbound-router";
import { runAfterResponse } from "@/lib/after-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook verification handshake (GET). */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type InboundMessage = {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
};

type WebhookPayload = {
  entry?: { changes?: { value?: { messages?: InboundMessage[] } }[] }[];
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ received: true });
  }

  const messages = (payload.entry ?? [])
    .flatMap((entry) => entry.changes ?? [])
    .flatMap((change) => change.value?.messages ?? [])
    .filter((m): m is Required<Pick<InboundMessage, "from" | "id">> & InboundMessage =>
      m.type === "text" && Boolean(m.from) && Boolean(m.id) && Boolean(m.text?.body),
    );

  // Acknowledge immediately; handle replies after the response so Meta doesn't retry.
  if (messages.length > 0) {
    runAfterResponse("Inbound WhatsApp", async () => {
      for (const m of messages) {
        await handleInboundWhatsApp({
          fromPhone: m.from,
          text: m.text?.body ?? "",
          waMessageId: m.id,
        }).catch((error) => console.error("Inbound WhatsApp handling failed:", error));
      }
    });
  }

  return NextResponse.json({ received: true });
}
