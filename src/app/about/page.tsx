import type { Metadata } from "next";
import Link from "next/link";
import { ArdenoStudioLogo } from "@/components/ArdenoStudioLogo";
import { LogoIcon } from "@/components/Logo";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";

export const metadata: Metadata = {
  title: "About Us — The Booking Tool Sri Lanka Needed | Dinaya",
  description:
    "Dinaya was built to help Sri Lankan businesses stop losing clients to WhatsApp chaos. Simple, local, and made for how business works here — start with a 14-day free trial.",
};

const values = [
  {
    title: "Built for Sri Lanka",
    desc: "Every decision — currency, payment gateway, language, pricing — is made with Sri Lankan businesses in mind. Not adapted from a global product.",
  },
  {
    title: "Radically simple",
    desc: "If a salon owner in Kandy can't set it up in five minutes, we haven't done our job. Simplicity isn't a feature — it's the product.",
  },
  {
    title: "Honest pricing",
    desc: "Start with a 14-day free trial. No hidden fees, no commission on your bookings, no USD subscriptions. You keep what you earn.",
  },
  {
    title: "Our users first",
    desc: "We talk to business owners every week. Features come from real problems, not roadmap guesswork. Your feedback shapes the product.",
  },
];

const stats = [
  { value: "5 min", label: "To go live" },
  { value: "0%", label: "Commission taken" },
  { value: "14-day", label: "Free trial" },
  { value: "24/7", label: "Bookings accepted" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 public-page-offset pb-14 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-7">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <Icon name="geo-alt-fill" className="text-xs text-primary" />
              Made in Sri Lanka
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl md:text-6xl tracking-tight mb-6 text-balance">
            <FadeSpan>We built the booking tool</FadeSpan>{" "}
            <FadeSpan className="text-primary">Sri Lanka needed.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Too many great Sri Lankan businesses were losing clients to WhatsApp chaos.
              We set out to fix that — simple, fast, and built for how business actually
              works here.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Stat bar — one confident row, no cards */}
      <section className="max-w-4xl mx-auto px-6 pb-24 md:pb-28">
        <div className="flex flex-wrap items-stretch justify-center border-y border-gray-200 dark:border-neutral-800 divide-x divide-gray-200 dark:divide-neutral-800">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 basis-1/2 sm:basis-0 text-center px-4 py-7 md:py-9">
              <div className="font-cal text-3xl md:text-4xl tracking-tight text-foreground mb-1.5 tabular-nums">
                {s.value}
              </div>
              <div className="text-[11px] md:text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto — numbered, not carded */}
      <section className="max-w-3xl mx-auto px-6 pb-24 md:pb-28">
        <div className="mb-14 md:mb-16">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-4">
            What we believe
          </p>
          <h2 className="font-cal text-3xl md:text-5xl tracking-tight text-balance">
            Four ideas behind everything we build.
          </h2>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-800">
          {values.map((v, i) => (
            <div
              key={v.title}
              className="group grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 sm:gap-8 py-8 md:py-10 border-b border-gray-200 dark:border-neutral-800"
            >
              <span className="font-cal text-3xl md:text-5xl tracking-tight text-gray-200 dark:text-neutral-800 group-hover:text-primary transition-colors duration-300 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-cal text-xl md:text-2xl tracking-tight mb-2">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-lg">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Read the full story — one confident break in the page */}
      <section className="px-6 pb-24 md:pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 md:py-16 text-center">
            <LogoIcon className="pointer-events-none absolute -right-8 -bottom-10 h-44 w-44 text-white/10" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-4">
              The origin story
            </p>
            <h2 className="relative font-cal text-2xl md:text-4xl tracking-tight text-white max-w-xl mx-auto mb-7 text-balance">
              From 47 unread WhatsApp messages to the tool Sri Lanka needed.
            </h2>
            <Link
              href="/our-story"
              className="relative inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              Read our story
              <Icon name="arrow-right" className="text-sm" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team — a signature, not a feature card */}
      <section className="max-w-md mx-auto px-6 pb-24 md:pb-28 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-6">
          The team behind Dinaya
        </p>
        <ArdenoStudioLogo size="md" className="mx-auto mb-6" />
        <p className="text-muted-foreground leading-relaxed">
          A Sri Lankan product studio building software that solves real problems for local
          businesses. Dinaya is our first public product — and we&apos;re just getting started.
        </p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Ready to go bookable?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Set up your free booking page in five minutes. No card required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-blue-50 transition-colors"
                >
                  {MARKETING_CTA_PRIMARY}
                  <Icon name="arrow-right" className="text-sm" />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 bg-black/25 border border-white/35 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-black/40 backdrop-blur-sm transition-colors"
                >
                  See all features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
