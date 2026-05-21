export type ResourceLink = {
  icon: string;
  color: string;
  title: string;
  desc: string;
  href: string;
};

export const RESOURCE_LINKS: ResourceLink[] = [
  {
    icon: "bi-book-open",
    color: "bg-amber-500",
    title: "Getting started",
    desc: "Set up your page in 5 minutes",
    href: "/register",
  },
  {
    icon: "bi-question-circle",
    color: "bg-blue-600",
    title: "Help center",
    desc: "Answers to common questions",
    href: "/help",
  },
  {
    icon: "bi-stars",
    color: "bg-violet-500",
    title: "What's new",
    desc: "Latest features and updates",
    href: "/whats-new",
  },
  {
    icon: "bi-file-text",
    color: "bg-amber-500",
    title: "Legal",
    desc: "Terms, privacy, refund policy",
    href: "/legal/terms",
  },
];
