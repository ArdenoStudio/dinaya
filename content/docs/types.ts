export type DocsCategoryId =
  | "getting-started"
  | "workspace"
  | "catalog"
  | "growth"
  | "configure"
  | "clients"
  | "team";

export type PlanTier = "free" | "pro" | "max";

export type DocsHotspot = {
  x: number;
  y: number;
  label?: string;
  showCursor?: boolean;
};

export type GuideVisual =
  | { type: "mockup"; mockupId: string }
  | { type: "screenshot"; src: string; alt?: string }
  | { type: "custom"; componentId: string };

export type GuideStep = {
  title: string;
  body: string;
  visual?: GuideVisual;
  hotspots?: DocsHotspot[];
};

export type DocsGuide = {
  slug: string;
  title: string;
  description: string;
  category: DocsCategoryId;
  estimatedMinutes: number;
  planRequired?: PlanTier;
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
