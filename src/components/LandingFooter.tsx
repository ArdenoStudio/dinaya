import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FooterColumn } from "@/components/FooterColumn";
import { getPublicSupportWhatsApp } from "@/lib/public-support";
import { MARKETING_CTA_HERO, MARKETING_CTA_NAV } from "@/lib/marketing-copy";

const supportWhatsApp = getPublicSupportWhatsApp();

const SOCIAL_LINKS = [
  { name: "instagram", href: "https://instagram.com/dinaya.lk", label: "Instagram" },
  { name: "facebook",  href: "https://facebook.com/dinaya.lk",  label: "Facebook"  },
  ...(supportWhatsApp ? [{ name: "whatsapp", href: supportWhatsApp.href, label: "WhatsApp" }] : []),
] as const;

export function LandingFooter() {
  return (
    <footer className="relative w-full min-w-0 bg-[#050505] text-white overflow-hidden pt-24 pb-8 mt-24 rounded-t-[2.5rem]">
      {/* Subtle top border glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute top-0 inset-x-1/4 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-x-12 gap-y-0 md:gap-16 lg:gap-8 mb-24">

          {/* Brand & CTA */}
          <div className="flex flex-col mb-8 md:mb-0">
            <span className="font-cal text-3xl tracking-tight mb-5">Dinaya.lk</span>
            <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 max-w-sm mb-8 leading-relaxed text-sm">
              Online booking for Sri Lankan businesses. No WhatsApp chaos, no setup fees, no commissions.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors self-start"
            >
              {MARKETING_CTA_HERO}
              <Icon name="arrow-right" className="text-xs" />
            </Link>
          </div>

          {/* Links: Product */}
          <FooterColumn
            title="Product"
            links={[
              { label: "Features", href: "/features" },
              { label: "Documentation", href: "/docs" },
              { label: "Help center", href: "/help" },
              { label: "Pricing", href: "/pricing" },
              { label: "Solutions", href: "/solutions" },
              { label: MARKETING_CTA_NAV, href: "/register" },
              { label: "Sign in", href: "/auth/signin" },
            ]}
          />

          {/* Links: About */}
          <FooterColumn
            title="About"
            links={[
              { label: "About Us", href: "/about" },
              { label: "Our Story", href: "/our-story" },
              { label: "Contact", href: "/contact" },
            ]}
          />

          {/* Links: Resources */}
          <FooterColumn
            title="Resources"
            links={[
              { label: "Getting started", href: "/register" },
              { label: "Help center", href: "/help" },
              { label: "What's new", href: "/whats-new" },
            ]}
          />

          {/* Links: Legal */}
          <FooterColumn
            title="Legal"
            links={[
              { label: "Brand", href: "/brand" },
              { label: "Terms of Service", href: "/legal/terms" },
              { label: "Privacy Policy", href: "/legal/privacy" },
              { label: "Refund Policy", href: "/legal/refund" },
            ]}
          />
        </div>

        {/* Sri Lanka trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10 pb-10 border-b border-white/10 text-xs text-gray-400">
          {[
            { icon: "geo-alt-fill", text: "Built for Sri Lanka" },
            { icon: "currency-dollar", text: "No USD subscriptions" },
            { icon: "percent", text: "Zero commission on bookings" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <Icon name={item.icon} className="text-primary text-xs" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Payment providers */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-10 pb-10 border-b border-white/10">
          <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
            Accept payments via
          </span>
          {["PayHere", "Visa", "Mastercard", "LankaQR", "FriMi"].map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Bottom Metadata */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} Dinaya by</span>
            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-default">Ardeno Studio</span>
          </div>
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ name, href, label }) => (
              <a
                key={name}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white dark:hover:bg-neutral-800/15 border border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <Icon name={name} size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mega Logo — centered, proportional, fading out at the bottom */}
      <div
        className="w-full flex items-center justify-center overflow-hidden pt-6 pb-0 select-none pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, white 0%, white 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, white 0%, white 40%, transparent 100%)",
          opacity: 0.12,
        }}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-[2vw] px-4 sm:px-8 w-full max-w-full min-w-0">
          {/* Spiral icon mark */}
          <svg
            viewBox="318 319 875 866"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            fill="white"
            style={{ height: "clamp(2.5rem, 10vw, 14rem)", width: "auto", flexShrink: 0 }}
          >
            <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
          </svg>

          {/* Wordmark */}
          <span
            className="font-cal tracking-tighter text-white leading-none"
            style={{ fontSize: "clamp(2rem, 10vw, 13rem)" }}
          >
            Dinaya.lk
          </span>
        </div>
      </div>
    </footer>
  );
}
