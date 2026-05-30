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
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-white">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-6 public-page-offset pb-10 flex gap-10">
        <DocsSidebar />
        <div className="flex-1 min-w-0">
          <DocsMobileNav />
          {children}
        </div>
      </div>
      <LandingFooter />
    </main>
  );
}
