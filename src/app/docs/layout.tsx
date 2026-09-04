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
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(240_8%_99%)_0%,hsl(0_0%_100%)_42%,hsl(240_6%_98%)_100%)] dark:bg-[linear-gradient(180deg,hsl(240_6%_6%)_0%,hsl(240_5%_8%)_42%,hsl(240_6%_7%)_100%)]">
      <PublicNav />
      <div className="mx-auto flex max-w-7xl gap-8 px-5 public-page-offset pb-12 sm:px-6 lg:gap-10">
        <DocsSidebar />
        <div className="min-w-0 flex-1">
          <DocsMobileNav />
          {children}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
