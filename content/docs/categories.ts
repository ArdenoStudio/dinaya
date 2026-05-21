import type { DocsCategory } from "./types";

export const docsCategories: DocsCategory[] = [
  {
    id: "getting-started",
    label: "Getting started",
    description: "Sign up, onboarding, and your first booking page",
    icon: "bi-rocket-takeoff",
    href: "/docs#getting-started",
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Calendar, bookings, clients, and daily operations",
    icon: "bi-layout-text-window",
    href: "/docs#workspace",
  },
  {
    id: "catalog",
    label: "Catalog",
    description: "Services, staff, locations, and availability",
    icon: "bi-scissors",
    href: "/docs#catalog",
  },
  {
    id: "growth",
    label: "Growth",
    description: "Reviews, payments, marketing, AI, and reports",
    icon: "bi-graph-up-arrow",
    href: "/docs#growth",
  },
  {
    id: "configure",
    label: "Configure",
    description: "Settings, integrations, automations, and billing",
    icon: "bi-gear",
    href: "/docs#configure",
  },
  {
    id: "clients",
    label: "For your clients",
    description: "How customers book, manage, and review appointments",
    icon: "bi-phone",
    href: "/docs#clients",
  },
  {
    id: "team",
    label: "Team & account",
    description: "Invites, passwords, plans, and account management",
    icon: "bi-people",
    href: "/docs#team",
  },
];

export function getCategoryLabel(id: string): string {
  return docsCategories.find((c) => c.id === id)?.label ?? id;
}
