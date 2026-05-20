import { Logo } from "@/components/Logo";
import { LandingFooter } from "@/components/LandingFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Logo size="lg" />
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
