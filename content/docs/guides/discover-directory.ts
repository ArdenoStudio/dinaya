import type { DocsGuide } from "../types";

export const discoverDirectoryGuide: DocsGuide = {
  slug: "discover-directory",
  title: "Discover directory listing",
  description: "Get found by new clients browsing Dinaya's public directory.",
  category: "growth",
  estimatedMinutes: 3,
  relatedGuides: ["share-booking-link"],
  steps: [
    {
      title: "Enable listing",
      body: "In Dashboard → Marketing, turn on directory listing and choose your city and category.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightNav: "Marketing",
      hotspots: [{ x: 58, y: 78, label: "Directory", showCursor: true }],
    },
    {
      title: "Public discover page",
      body: "Listed businesses appear on dinaya.lk/discover and city pages like /discover/colombo.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
    },
    {
      title: "Complete your profile",
      body: "A clear photo, description, and active services improve click-through to your booking page.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
    },
  ],
};
