export type DocsCategoryId =
  | "getting-started"
  | "workspace"
  | "catalog"
  | "growth"
  | "configure"
  | "clients"
  | "team";

export type PlanTier = "free" | "pro" | "max";

/** @deprecated Prefer highlightTarget on mockup steps — %-coords drift when frame height changes. */
export type DocsHotspot = {
  x: number;
  y: number;
  label?: string;
  showCursor?: boolean;
};

/** Element ID inside dashboard/booking mockups — cursor attaches to the real node. */
export type DocsMockupTarget =
  | "onboarding-business-info"
  | "marketing-booking-link"
  | "marketing-copy-link"
  | "marketing-qr-code"
  | "marketing-whatsapp"
  | "marketing-directory"
  | "marketing-embed"
  | "availability-weekly-hours"
  | "availability-blocked-dates"
  | "services-add-service"
  | "services-row"
  | "bookings-new-booking"
  | "bookings-row"
  | "bookings-reschedule"
  | "bookings-cancel"
  | "bookings-refund"
  | "billing-upgrade"
  | "integrations-connect"
  | "booking-service-card"
  | "booking-time-slot"
  | "booking-confirm-pay"
  | "booking-stars"
  | "booking-reschedule"
  | "booking-cancel";

export type GuideVisual =
  | { type: "mockup"; mockupId: string }
  | { type: "screenshot"; src: string; alt?: string }
  | { type: "custom"; componentId: string };

/** Sidebar nav label — matches DASHBOARD_NAV_GROUPS in dashboard-nav-layout.ts */
export type DashboardNavHighlight =
  | "Overview"
  | "Calendar"
  | "Bookings"
  | "Clients"
  | "Services"
  | "Staff"
  | "Locations"
  | "Availability"
  | "Reviews"
  | "Payments"
  | "Marketing"
  | "AI Hub"
  | "Reports"
  | "Integrations"
  | "Automations"
  | "Settings";

export type GuideStep = {
  title: string;
  body: string;
  visual?: GuideVisual;
  /** Highlights a sidebar item with an attached cursor (dashboard mockups only). */
  highlightNav?: DashboardNavHighlight;
  /** Highlights a button/row inside the mockup UI (preferred over hotspots). */
  highlightTarget?: DocsMockupTarget;
  /** Only for real screenshot images — not mockups. */
  hotspots?: DocsHotspot[];
};

export type DocsGuide = {
  slug: string;
  title: string;
  description: string;
  category: DocsCategoryId;
  estimatedMinutes: number;
  planRequired?: PlanTier;
  /** Override preview mockup on docs hub cards (defaults to first step visual). */
  thumbnailMockupId?: string;
  steps: GuideStep[];
  relatedGuides?: string[];
  faqIds?: string[];
};

export type FaqItem = {
  id: string;
  q: string;
  a: string;
  guideSlug?: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
  colorClasses: {
    bg: string;
    ring: string;
    icon: string;
    text: string;
    accent: string;
    pillBg: string;
    pillText: string;
    pillRing: string;
  };
  faqs: FaqItem[];
};

export type DocsCategory = {
  id: DocsCategoryId;
  label: string;
  description: string;
  icon: string;
  href: string;
};

export type ReferencePage = {
  slug: string;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
};

export type PopularHelpArticle = {
  icon: string;
  label: string;
  cat: string;
  guideSlug?: string;
};
