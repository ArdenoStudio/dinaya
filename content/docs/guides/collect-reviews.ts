import type { DocsGuide } from "../types";

export const collectReviewsGuide: DocsGuide = {
  slug: "collect-reviews",
  title: "Collect reviews",
  description: "Ask for feedback after appointments and reply from your dashboard.",
  category: "growth",
  estimatedMinutes: 4,
  relatedGuides: ["share-booking-link"],
  steps: [
    {
      title: "Enable review requests",
      body: "After an appointment, clients receive a review link by email. Manage settings under Dashboard → Reviews.",
      visual: { type: "mockup", mockupId: "dashboard-reviews" },
      highlightNav: "Reviews",
    },
    {
      title: "Client leaves a review",
      body: "Clients rate 1–5 stars and optionally leave a comment — no account needed.",
      visual: { type: "mockup", mockupId: "booking-review" },
      highlightTarget: "booking-stars",
    },
    {
      title: "View & reply",
      body: "See all reviews on your Reviews page. Reply publicly to thank clients or address concerns.",
      visual: { type: "mockup", mockupId: "dashboard-reviews" },
    },
    {
      title: "AI reply suggestions",
      body: "On Max plans, use AI-suggested replies to respond faster while keeping your voice.",
      visual: { type: "mockup", mockupId: "dashboard-reviews" },
    },
  ],
};
