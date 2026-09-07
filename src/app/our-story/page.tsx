import type { Metadata } from "next";
import Link from "next/link";
import { ArdenoStudioLogo } from "@/components/ArdenoStudioLogo";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { ScrollReveal } from "@/components/ScrollReveal";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";

export const metadata: Metadata = {
  title: "Our Story — From WhatsApp Chaos to Dinaya | Dinaya",
  description:
    "How Dinaya started with 47 unread booking messages and became the booking tool Sri Lankan businesses needed.",
};

const problems = [
  {
    icon: "chat-square-dots",
    title: "Inbox overload",
    desc: "Every booking is a thread. Confirm the time, re-confirm the date, follow up again when they go quiet.",
  },
  {
    icon: "x-circle",
    title: "No-shows with no warning",
    desc: "No deposit, no system, no recourse. Clients forget and you're left with an empty slot and lost income.",
  },
  {
    icon: "journal-x",
    title: "Scheduling by notebook",
    desc: "Paper diaries, voice notes, and memory. One mix-up means a double booking and an uncomfortable conversation.",
  },
];

const timeline = [
  {
    period: "Q1 2024",
    dot: "bg-amber-500",
    title: "The idea",
    desc: "Started with a simple question: why doesn't a booking tool exist that actually works for Sri Lankan businesses?",
  },
  {
    period: "Q2 2024",
    dot: "bg-blue-600",
    title: "First conversations",
    desc: "Spoke to over 30 business owners — salons, tutors, clinics — and validated that the problem was universal.",
  },
  {
    period: "Q3 2024",
    dot: "bg-violet-500",
    title: "Building begins",
    desc: "The first version of Dinaya took shape: booking pages, PayHere integration, and SMS reminders.",
  },
  {
    period: "Q1 2025",
    dot: "bg-blue-600",
    title: "Public launch",
    desc: "Dinaya went live. Real businesses, real bookings, and real feedback that keeps shaping the product.",
  },
];

function ChapterNumber({ n }: { n: number }) {
  return (
    <div className="font-cal text-3xl sm:text-4xl text-gray-200 dark:text-neutral-800 tabular-nums pt-1" aria-hidden="true">
      {String(n).padStart(2, "0")}
    </div>
  );
}

export default function OurStoryPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 public-page-offset pb-16 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-xs">
              <Icon name="heart-fill" className="text-xs text-primary" />
              Our story
            </span>
          </FadeDiv>

          <h1 className="font-cal text-4xl md:text-5xl tracking-tight mb-5 text-balance">
            <FadeSpan>We got tired of watching great businesses</FadeSpan>{" "}
            <FadeSpan className="text-primary">lose clients to WhatsApp chaos.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We watched salon owners, clinic managers, and tuition teachers spend hours every
              day just coordinating bookings over DMs. So we built the tool Sri Lanka was missing
              — simple, local, and free to try.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Chapters — one continuous narrative spine */}
      <section className="max-w-3xl mx-auto px-6 pb-24 md:pb-32">
        <div className="space-y-20 md:space-y-28">

          {/* 01 — The problem */}
          <ScrollReveal className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-5 sm:gap-10">
            <ChapterNumber n={1} />
            <div className="border-l-2 border-gray-200 dark:border-neutral-800 pl-6 sm:pl-10">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-3">The problem</p>
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-8 text-balance">
                Running a business in Sri Lanka shouldn&apos;t mean living in your WhatsApp inbox.
              </h2>
              <ul className="space-y-5">
                {problems.map((p) => (
                  <li key={p.title} className="flex gap-4">
                    <Icon name={p.icon} className="text-lg text-gray-400 dark:text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* 02 — The spark */}
          <ScrollReveal className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-5 sm:gap-10">
            <ChapterNumber n={2} />
            <div className="border-l-2 border-gray-200 dark:border-neutral-800 pl-6 sm:pl-10">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-3">How it started</p>
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-8 text-balance">
                One conversation. 47 unread messages.
              </h2>
              <div className="space-y-5 text-muted-foreground leading-relaxed mb-10">
                <p>
                  It started with a conversation in 2024. A friend who runs a small hair salon in
                  Colombo showed us her WhatsApp — 47 unread booking messages, all needing a
                  manual reply.
                </p>
                <p>
                  We looked at the tools that existed. Most were built for US or European
                  markets: prices in USD, payment gateways that don&apos;t work locally,
                  interfaces that assume your clients use Google Calendar.
                </p>
                <p>
                  So we built our own. We spent months talking to salon owners, tutors, clinic
                  managers, and fitness coaches across Sri Lanka. We asked one question over and
                  over: what would actually make your life easier?
                </p>
                <p>
                  The answer was always the same: something simple, something local, something
                  free to start. That became Dinaya.
                </p>
              </div>
              <blockquote className="border-l-2 border-primary pl-6">
                <p className="font-cal text-2xl md:text-3xl tracking-tight text-foreground leading-snug mb-3 text-balance">
                  &ldquo;47 unread booking messages. That was the moment we knew we had to build
                  this.&rdquo;
                </p>
                <cite className="text-sm text-muted-foreground not-italic">
                  — The conversation that started Dinaya
                </cite>
              </blockquote>
            </div>
          </ScrollReveal>

          {/* 03 — The journey */}
          <ScrollReveal className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-5 sm:gap-10">
            <ChapterNumber n={3} />
            <div className="border-l-2 border-gray-200 dark:border-neutral-800 pl-6 sm:pl-10">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-3">The journey</p>
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-10 text-balance">
                From a WhatsApp screenshot to a product used by real businesses.
              </h2>
              <div className="space-y-8">
                {timeline.map((item) => (
                  <div key={item.period} className="relative pl-6">
                    <span className={`absolute left-0 top-[0.4rem] size-2 rounded-full ${item.dot}`} />
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      {item.period}
                    </p>
                    <h3 className="font-cal text-lg tracking-tight mb-1">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* 04 — Today */}
          <ScrollReveal className="grid grid-cols-[3rem_1fr] sm:grid-cols-[5rem_1fr] gap-5 sm:gap-10">
            <ChapterNumber n={4} />
            <div className="border-l-2 border-gray-200 dark:border-neutral-800 pl-6 sm:pl-10">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-3">Today</p>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                Dinaya is built by a small team at{" "}
                <Link href="/about" className="text-foreground font-medium hover:text-primary transition-colors">
                  Ardeno Studio
                </Link>
                , a Sri Lankan product studio.
              </p>
              <ArdenoStudioLogo size="sm" className="opacity-80" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Part of the story starts with you.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Create your booking page in five minutes. No card required for the trial.
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
                  href="/about"
                  className="inline-flex items-center gap-2 bg-black/25 border border-white/35 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-black/40 backdrop-blur-xs transition-colors"
                >
                  Meet the team
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
