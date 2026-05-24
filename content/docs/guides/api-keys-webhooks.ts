import type { DocsGuide } from "../types";

export const apiKeysWebhooksGuide: DocsGuide = {
  slug: "api-keys-webhooks",
  title: "API keys & webhooks",
  description: "Integrate Dinaya with your own tools and workflows.",
  category: "configure",
  estimatedMinutes: 5,
  planRequired: "pro",
  relatedGuides: ["upgrade-plan"],
  steps: [
    {
      title: "API keys",
      body: "Create API keys under Settings → API keys. Use them to call the public API at /api/v1/bookings and /api/v1/availability.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
      highlightNav: "Integrations",
    },
    {
      title: "Authentication",
      body: "Send your API key in the Authorization header. Keys can be revoked anytime from the dashboard.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
    },
    {
      title: "Webhooks",
      body: "Under Settings → Webhooks, add an endpoint URL. Dinaya POSTs JSON when bookings are created or updated.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
    },
    {
      title: "Retries",
      body: "Failed webhook deliveries retry automatically every 15 minutes. Check delivery logs in the dashboard.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
    },
  ],
};
