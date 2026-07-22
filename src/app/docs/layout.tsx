import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMobileNav } from "@/components/docs/DocsMobileNav";
import { DOCS_HUB_MARKDOWN_PATH, DOCS_HUB_PATH } from "@/lib/docs/paths";
import { buildAbsoluteAppUrl } from "@/lib/docs/site-url";

export const metadata: Metadata = {
  title: "Documentation — Guides & Tutorials | Dinaya",
  description:
    "Step-by-step guides for setting up your booking page, payments, availability, marketing, and every Dinaya feature.",
  alternates: {
    canonical: buildAbsoluteAppUrl(DOCS_HUB_PATH),
    types: {
      "text/markdown": buildAbsoluteAppUrl(DOCS_HUB_MARKDOWN_PATH),
    },
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(240_8%_99%)_0%,hsl(0_0%_100%)_42%,hsl(240_6%_98%)_100%)]">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-6 public-page-offset pb-10 flex gap-10">
        <DocsSidebar />
        <div className="flex-1 min-w-0">
          <DocsMobileNav />
          {children}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
