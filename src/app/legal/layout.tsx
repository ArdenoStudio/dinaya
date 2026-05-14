import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Logo size="lg" />
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {children}
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6">
          <Link href="/legal/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/legal/refund" className="hover:text-foreground">Refund Policy</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Dinaya by Ardeno Studio</p>
      </footer>
    </div>
  );
}
