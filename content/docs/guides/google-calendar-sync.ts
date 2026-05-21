import type { DocsGuide } from "../types";

export const googleCalendarSyncGuide: DocsGuide = {
  slug: "google-calendar-sync",
  title: "Google Calendar sync",
  description: "Keep Dinaya and Google Calendar in sync automatically.",
  category: "configure",
  estimatedMinutes: 4,
  planRequired: "pro",
  relatedGuides: ["dashboard-calendar"],
  steps: [
    {
      title: "Open Integrations",
      body: "Go to Dashboard → Settings → Integrations. Google Calendar is available on Pro and Max.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
      highlightNav: "Integrations",
    },
    {
      title: "Connect Google",
      body: "Click Connect and sign in with the Google account that owns your business calendar.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
      hotspots: [{ x: 58, y: 48, label: "Connect", showCursor: true }],
    },
    {
      title: "Choose calendar",
      body: "Select which Google calendar receives new Dinaya bookings.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
    },
    {
      title: "Sync behavior",
      body: "New bookings appear in Google within an hour via background sync. Changes in Dinaya update the external event.",
      visual: { type: "mockup", mockupId: "dashboard-integrations" },
    },
  ],
};
