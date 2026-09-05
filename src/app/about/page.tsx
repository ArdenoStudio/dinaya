import type { Metadata } from "next";
import Link from "next/link";
import { ArdenoStudioLogo } from "@/components/ArdenoStudioLogo";
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
    icon: "geo-alt-fill",
    color: "bg-blue-600",
    title: "Built for Sri Lanka",
    desc: "Every decision — currency, payment gateway, language, pricing — is made with Sri Lankan businesses in mind. Not adapted from a global product.",
  },
  {
    icon: "lightning-charge",
    color: "bg-amber-500",
    title: "Radically simple",
    desc: "If a salon owner in Kandy can't set it up in five minutes, we haven't done our job. Simplicity isn't a feature — it's the product.",
  },
  {
    icon: "shield-check",
    color: "bg-violet-500",
    title: "Honest pricing",
    desc: "Start with a 14-day free trial. No hidden fees, no commission on your bookings, no USD subscriptions. You keep what you earn.",
  },
  {
    icon: "people-fill",
    color: "bg-blue-600",
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
      <section className="max-w-4xl mx-auto px-6 public-page-offset pb-16 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <Icon name="geo-alt-fill" className="text-xs text-primary" />
              Made in Sri Lanka
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>We built the booking tool</FadeSpan>{" "}
            <FadeSpan className="text-primary">Sri Lanka needed.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dinaya started from a simple frustration: too many great Sri Lankan businesses were
              losing clients to WhatsApp chaos. We set out to fix that — simple, fast, and built
              for how business actually works here.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200 dark:bg-neutral-700/70 rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800/70">
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-neutral-900 px-6 py-7 text-center">
              <div className="font-cal text-3xl tracking-tight text-primary mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Read the full story — teaser, not a retelling */}
      <div className="bg-gray-50/80 dark:bg-neutral-900/40 border-y border-gray-100 dark:border-neutral-800/60">
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary mb-5">
            <Icon name="heart-fill" className="text-xl" />
          </div>
          <h2 className="font-cal text-2xl md:text-3xl tracking-tight mb-3">
            Curious how Dinaya started?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            From 47 unread WhatsApp messages to a booking tool built for Sri Lankan businesses —
            read the full journey.
          </p>
          <Link
            href="/our-story"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            Read our story
            <Icon name="arrow-right" className="text-xs" />
          </Link>
        </section>
      </div>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            What we believe
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            The principles behind everything we build.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-gray-200 dark:bg-neutral-700/70 rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800/70">
          {values.map((v) => (
            <div key={v.title} className="group p-8 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800/80 transition-colors">
              <div className="mb-5 inline-flex">
                <div className={`flex items-center justify-center size-11 rounded-xl ${v.color} text-white`}>
                  <Icon name={v.icon} className="text-[1.1rem]" />
                </div>
              </div>
              <h3 className="font-cal text-xl mb-2 tracking-tight">{v.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Made by Ardeno Studio */}
      <div className="bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/10 dark:to-transparent">
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-8 md:p-12 text-center shadow-sm">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-5">The team behind Dinaya</p>
            <div className="flex items-center justify-center mb-6">
              <ArdenoStudioLogo size="xl" className="w-full max-w-xs" />
            </div>
            <h2 className="font-cal text-2xl md:text-3xl tracking-tight mb-4">
              Dinaya is a product by Ardeno Studio.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Ardeno Studio is a Sri Lankan product studio focused on building software that
              solves real problems for local businesses. Dinaya is our first public product —
              and we&apos;re just getting started.
            </p>
          </div>
        </section>
      </div>

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
