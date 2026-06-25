import type { PlanFeature } from "@/lib/plan";

export type AiCopyInput = {
  businessName: string;
  clientName?: string;
  feature: PlanFeature;
  serviceName?: string;
  staffName?: string;
  startsAtLabel?: string;
  bookingUrl?: string;
  reviewUrl?: string;
  locationName?: string;
  extra?: string;
};

export type AiCopyResult = {
  subject: string;
  body: string;
  source: "ai" | "fallback";
};

function reminderFallback(input: AiCopyInput): AiCopyResult {
  return {
    subject: `Reminder: your appointment with ${input.businessName}`,
    body: `Hi ${input.clientName ?? "there"}, reminder for your ${input.serviceName ?? "appointment"}${input.startsAtLabel ? ` on ${input.startsAtLabel}` : ""}. See you soon.`,
    source: "fallback",
  };
}

function reactivationFallback(input: AiCopyInput): AiCopyResult {
  return {
    subject: `${input.businessName} would love to see you again`,
    body: `Hi ${input.clientName ?? "there"}, it has been a while since your last visit. Book your next appointment here: ${input.bookingUrl ?? ""}`.trim(),
    source: "fallback",
  };
}

const FALLBACKS: Record<PlanFeature, (input: AiCopyInput) => AiCopyResult> = {
  aiBookingAutopilot: (input) => ({
    subject: `A slot is open at ${input.businessName}`,
    body: `Hi ${input.clientName ?? "there"}, ${input.businessName} has an opening${input.startsAtLabel ? ` on ${input.startsAtLabel}` : ""}. Book again here: ${input.bookingUrl ?? ""}`.trim(),
    source: "fallback",
  }),
  smartReminderSystem: reminderFallback,
  reviewEngine: (input) => ({
    subject: `How was your visit to ${input.businessName}?`,
    body: `Hi ${input.clientName ?? "there"}, thank you for visiting ${input.businessName}. Share a quick review here: ${input.reviewUrl ?? ""}`.trim(),
    source: "fallback",
  }),
  clientReactivationCampaign: reactivationFallback,
  aiDealSuggestions: (input) => ({
    subject: `Fill slow slots at ${input.businessName}`,
    body: `${input.extra ?? "You have open appointment time coming up."} Post a flash deal to fill it on Dinaya Deals.`,
    source: "fallback",
  }),
  aiUpsellAssistant: (input) => ({
    subject: `Recommended add-on from ${input.businessName}`,
    body: `Many clients pair ${input.serviceName ?? "this booking"} with ${input.extra ?? "a follow-up service"}. Ask ${input.businessName} about it during your visit.`,
    source: "fallback",
  }),
  aiVoiceReceptionist: (input) => ({
    subject: `${input.businessName} AI voice receptionist`,
    body: `When clients call ${input.businessName}, the AI receptionist can answer common questions, check availability, and book appointments through Dinaya.`,
    source: "fallback",
  }),
  aiContentMachine: (input) => ({
    subject: `${input.businessName} content idea`,
    body: `Appointments are open this week at ${input.businessName}${input.locationName ? ` - ${input.locationName}` : ""}. Message us or book online${input.bookingUrl ? `: ${input.bookingUrl}` : "."}`,
    source: "fallback",
  }),
  vipLoyaltySequence: (input) => ({
    subject: `A thank you from ${input.businessName}`,
    body: `Hi ${input.clientName ?? "there"}, thank you for being one of ${input.businessName}'s regular clients. We'd love to welcome you back soon: ${input.bookingUrl ?? ""}`.trim(),
    source: "fallback",
  }),
  automations: reminderFallback,
  broadcasts: reactivationFallback,
  deals: (input) => ({
    subject: `New deal from ${input.businessName}`,
    body: `${input.businessName} posted a limited-time booking deal${input.extra ? `: ${input.extra}` : "."}`,
    source: "fallback",
  }),
  googleCalendarSync: reminderFallback,
  intakeForms: reminderFallback,
  payments: reminderFallback,
  publicBookingPage: (input) => ({
    subject: `Book with ${input.businessName}`,
    body: `Book your next appointment with ${input.businessName}${input.bookingUrl ? `: ${input.bookingUrl}` : "."}`,
    source: "fallback",
  }),
  publicBookingPageCustomization: (input) => ({
    subject: `Book with ${input.businessName}`,
    body: `Book your next appointment with ${input.businessName}${input.bookingUrl ? `: ${input.bookingUrl}` : "."}`,
    source: "fallback",
  }),
  bookingPageTheme: (input) => ({
    subject: `Book with ${input.businessName}`,
    body: `Book your next appointment with ${input.businessName}${input.bookingUrl ? `: ${input.bookingUrl}` : "."}`,
    source: "fallback",
  }),
  reports: reminderFallback,
  reviews: (input) => ({
    subject: `How was your visit to ${input.businessName}?`,
    body: `Hi ${input.clientName ?? "there"}, thank you for visiting ${input.businessName}. Share a quick review here: ${input.reviewUrl ?? ""}`.trim(),
    source: "fallback",
  }),
  reviewReplies: (input) => ({
    subject: `Reply from ${input.businessName}`,
    body: `Thank you for your ${input.extra?.includes("Rating: 5") ? "wonderful" : ""} review, ${input.clientName ?? "there"}! We truly appreciate you choosing ${input.businessName} and hope to welcome you back soon.`,
    source: "fallback",
  }),
  webhooks: reminderFallback,
  whatsappSms: reminderFallback,
};

export async function generateAiCopy(input: AiCopyInput): Promise<AiCopyResult> {
  const provider = (process.env.AI_PROVIDER ?? "").toLowerCase();

  let apiKey: string | undefined;
  let baseUrl: string;
  let model: string;

  if (provider === "groq") {
    apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
    baseUrl = process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1";
    model = process.env.AI_MODEL ?? "llama-3.3-70b-versatile";
  } else if (provider === "openai" || process.env.OPENAI_API_KEY) {
    apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
    model = process.env.AI_MODEL ?? "gpt-4o-mini";
  } else {
    return FALLBACKS[input.feature](input);
  }

  if (!apiKey) {
    return FALLBACKS[input.feature](input);
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Write concise, warm Sri Lanka-local booking business copy for WhatsApp or SMS. Return JSON with subject and body only. Keep body under 320 characters.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return FALLBACKS[input.feature](input);
    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return FALLBACKS[input.feature](input);
    const parsed = JSON.parse(raw) as Partial<AiCopyResult>;
    if (!parsed.subject || !parsed.body) return FALLBACKS[input.feature](input);
    return { subject: parsed.subject, body: parsed.body, source: "ai" };
  } catch {
    return FALLBACKS[input.feature](input);
  }
}
