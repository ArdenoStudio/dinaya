export const AI_FEATURES = [
  "aiBookingAutopilot",
  "smartReminderSystem",
  "reviewEngine",
  "clientReactivationCampaign",
  "aiUpsellAssistant",
  "aiContentMachine",
  "vipLoyaltySequence",
  "aiDealSuggestions",
] as const;

export type AiFeatureKey = (typeof AI_FEATURES)[number];

export const AI_FEATURE_META: Record<
  AiFeatureKey,
  { label: string; description: string }
> = {
  aiBookingAutopilot: {
    label: "AI Booking Autopilot",
    description: "Fill empty slots with smart follow-ups and rebooking prompts.",
  },
  smartReminderSystem: {
    label: "Smart Reminder System",
    description: "Adaptive reminders that reduce no-shows per branch.",
  },
  reviewEngine: {
    label: "Review Engine",
    description: "Request reviews at the right moment after each visit.",
  },
  clientReactivationCampaign: {
    label: "Client Reactivation",
    description: "Win back clients who haven't booked in a while.",
  },
  aiUpsellAssistant: {
    label: "AI Upsell Assistant",
    description: "Suggest add-on services during booking and follow-up.",
  },
  aiContentMachine: {
    label: "30-Day Content Machine",
    description: "Generate social posts tailored to each branch.",
  },
  vipLoyaltySequence: {
    label: "VIP Loyalty Sequence",
    description: "Reward repeat clients with automated loyalty touchpoints.",
  },
  aiDealSuggestions: {
    label: "Smart Deal Suggestions",
    description: "AI recommends flash discounts for slow appointment slots.",
  },
};
