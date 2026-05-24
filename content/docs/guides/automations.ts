import type { DocsGuide } from "../types";

export const automationsGuide: DocsGuide = {
  slug: "automations",
  title: "Automations",
  description: "Send the right message at the right time with rule-based workflows.",
  category: "configure",
  estimatedMinutes: 5,
  planRequired: "pro",
  relatedGuides: ["ai-hub-overview"],
  steps: [
    {
      title: "Open Automations",
      body: "Go to Dashboard → Automations (Pro plan). Create rules that trigger on booking events.",
      visual: { type: "mockup", mockupId: "dashboard-automations" },
      highlightNav: "Automations",
    },
    {
      title: "Choose a trigger",
      body: "Triggers include new booking, reminder before appointment, completed visit, or cancelled booking.",
      visual: { type: "mockup", mockupId: "dashboard-automations" },
    },
    {
      title: "Pick channel",
      body: "Send via email, SMS, or WhatsApp depending on your plan and connected integrations.",
      visual: { type: "mockup", mockupId: "dashboard-automations" },
    },
    {
      title: "Edit message template",
      body: "Customize the message body with placeholders like client name, service, and time.",
      visual: { type: "mockup", mockupId: "dashboard-automations" },
    },
    {
      title: "Enable & monitor",
      body: "Turn the rule on and check run history to confirm messages are sending as expected.",
      visual: { type: "mockup", mockupId: "dashboard-automations" },
    },
  ],
};
