import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { LandingFooter } from "@/components/LandingFooter";

export const metadata: Metadata = {
  title: "Our Story — From WhatsApp Chaos to Dinaya | Dinaya",
  description:
    "How Dinaya started with 47 unread booking messages and became the booking tool Sri Lankan businesses needed.",
};

const problems = [
  {
    icon: "bi-chat-square-dots",
    title: "Inbox overload",
    desc: "Every booking is a thread. Confirm the time, re-confirm the date, follow up again when they go quiet.",
  },
  {
    icon: "bi-x-circle",
    title: "No-shows with no warning",
    desc: "No deposit, no system, no recourse. Clients forget and you're left with an empty slot and lost income.",
  },
  {
    icon: "bi-journal-x",
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

const principles = [
  {
    border: "border-l-blue-600",
    title: "Sri Lankan by design",
    desc: "PayHere, LKR, local language considerations — not bolted on after the fact. Built from day one for how business works here.",
  },
  {
    border: "border-l-amber-500",
    title: "Free to start, forever",
    desc: "Essentials are always free. Premium features exist; guilt-trips don't. You choose when and if you upgrade.",
  },
  {
    border: "border-l-violet-500",
    title: "Obsessively simple",
    desc: "If it takes more than 5 minutes to set up, we redesign it — not the user's expectations. Simplicity is the product.",
  },
  {
    border: "border-l-blue-600",
    title: "Built in public",
    desc: "We talk to users every week. Features are shaped by real conversations, not roadmap theatre or trend-chasing.",
  },
];

export default function OurStoryPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <i className="bi bi-heart-fill text-xs text-primary" />
              Our story
            </span>
          </FadeDiv>

          <h1 className="font-cal text-4xl md:text-5xl tracking-tight mb-5">
            <FadeSpan>We got tired of watching great businesses</FadeSpan>{" "}
            <FadeSpan className="text-primary">lose clients to WhatsApp chaos.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We watched salon owners, clinic managers, and tuition teachers spend hours every
              day just coordinating bookings over DMs. So we built the tool Sri Lanka was missing
              — simple, local, and free to start.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* The Problem */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            The problem
          </span>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 max-w-2xl">
            Running a business in Sri Lanka shouldn&apos;t mean living in your WhatsApp inbox.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {problems.map((p) => (
            <div key={p.title} className="bg-white p-8 hover:bg-gray-50/60 transition-colors">
              <div className="mb-5 inline-flex">
                <div className="flex items-center justify-center size-11 rounded-xl bg-gray-100 text-gray-500">
                  <i className={`bi ${p.icon} text-[1.1rem]`} />
                </div>
              </div>
              <h3 className="font-cal text-lg tracking-tight mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Spark */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              How it started
            </span>
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 mb-8">
              One conversation. 47 unread messages.
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                It started with a conversation in 2024. A friend who runs a small hair salon in
                Colombo showed us her WhatsApp — 47 unread booking messages, all needing a manual
                reply.
              </p>
              <p>
                We looked at the tools that existed. Most were built for US or European markets:
                prices in USD, payment gateways that don&apos;t work locally, interfaces that assume
                your clients use Google Calendar.
              </p>
              <p>
                So we built our own. We spent months talking to salon owners, tutors, clinic
                managers, and fitness coaches across Sri Lanka. We asked one question over and
                over: what would actually make your life easier?
              </p>
              <p>
                The answer was always the same: something simple, something local, something free
                to start. That became Dinaya.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 p-8 flex flex-col gap-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">2024</p>
            <blockquote className="font-cal text-xl tracking-tight text-gray-900 leading-snug">
              &ldquo;47 unread booking messages. That was the moment we knew we had to build this.&rdquo;
            </blockquote>
            <p className="text-sm text-muted-foreground italic">
              — The conversation that started Dinaya
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-100">
              {["Sri Lanka first", "LKR pricing", "Zero commission"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center rounded-full bg-white border border-blue-100 px-3 py-1 text-xs font-medium text-primary"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            The journey
          </span>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 max-w-2xl">
            From a WhatsApp screenshot to a product used by real businesses.
          </h2>
        </div>

        <div className="max-w-2xl relative pl-8 border-l-2 border-gray-200 space-y-10">
          {timeline.map((item) => (
            <div key={item.period} className="relative">
              <span className={`absolute -left-[1.3rem] top-1 size-[14px] rounded-full border-2 border-white ${item.dot} shadow-sm`} />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                {item.period}
              </p>
              <h3 className="font-cal text-lg tracking-tight mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Why we&apos;re different
          </span>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3">
            Not adapted. Built from scratch, for here.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {principles.map((p) => (
            <div
              key={p.title}
              className={`rounded-2xl border bg-white p-7 flex gap-5 border-l-4 ${p.border} hover:shadow-md transition-shadow`}
            >
              <div>
                <h3 className="font-cal text-lg tracking-tight mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="relative inline-block text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            The people
          </span>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 mb-4">
            A small team with an unreasonably large ambition.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Dinaya is built by Ardeno Studio, a Sri Lankan product studio. We&apos;re a small team
            that believes local software should be world-class.
          </p>
        </div>

        <div className="max-w-xl mx-auto rounded-2xl border bg-gray-50/50 p-10 text-center">
          <Image
            src="/ardeno-studio-logo.svg"
            alt="Ardeno Studio"
            width={140}
            height={35}
            className="h-7 w-auto brightness-0 opacity-40 mx-auto mb-5"
          />
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            We build software that solves real problems for local businesses.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Sri Lanka · 2024", "Public product · Dinaya", "Next product · TBA"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full bg-white border px-3 py-1 text-xs font-medium text-gray-600"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Part of the story starts with you.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Create your free booking page in five minutes.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
                >
                  Create your page — it&apos;s free
                  <i className="bi bi-arrow-right text-sm" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/20 transition-colors"
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
