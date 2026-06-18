import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-6 public-page-offset pb-12">
        {children}
      </div>
      <LandingFooter />
    </main>
  );
}
