import Link from "next/link";
import Image from "next/image";
import { FluidParticlesBackground } from "@/components/ui/fluid-particles-background";
import { Icon } from "@/components/ui/Icon";

export function LandingFooter() {
  return (
    <FluidParticlesBackground className="px-4 sm:px-6 lg:px-8 pb-6 -mt-28 pt-32 [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_30%)]">
      <footer className="w-full max-w-6xl mx-auto rounded-[2rem] border border-white/60 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] px-8 sm:px-10 pt-10 pb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-8 border-b border-gray-100">
          {/* Brand */}
          <div>
            <div className="mb-1">
              <span className="font-cal text-xl text-gray-900">Dinaya.lk</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Online booking for Sri Lankan businesses. No WhatsApp chaos, no setup fees, no commissions.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Get started free
              <Icon name="arrow-right" className="text-xs" />
            </Link>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Features", href: "/features" },
                { label: "Documentation", href: "/docs" },
                { label: "Help center", href: "/help" },
                { label: "Pricing", href: "/pricing" },
                { label: "Solutions", href: "/solutions" },
                { label: "Get started", href: "/register" },
                { label: "Sign in", href: "/login" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">About</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "About Us", href: "/about" },
                { label: "Our Story", href: "/our-story" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Brand", href: "/brand" },
                { label: "Terms of Service", href: "/legal/terms" },
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Refund Policy", href: "/legal/refund" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Dinaya by</span>
            <Image
              src="/ardeno-studio-logo.svg"
              alt="Ardeno Studio"
              width={80}
              height={20}
              className="h-4 w-auto brightness-0 opacity-25"
            />
          </div>
          <p className="text-xs text-muted-foreground">Made with ❤️ for Sri Lankan businesses</p>
        </div>
      </footer>
    </FluidParticlesBackground>
  );
}
