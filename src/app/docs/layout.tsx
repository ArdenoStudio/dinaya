import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMobileNav } from "@/components/docs/DocsMobileNav";

export const metadata: Metadata = {
  title: "Documentation — Guides & Tutorials | Dinaya",
  description:
    "Step-by-step guides for setting up your booking page, payments, availability, marketing, and every Dinaya feature.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
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
