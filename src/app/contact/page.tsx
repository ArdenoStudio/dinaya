"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";
import { getPublicSupportWhatsApp } from "@/lib/public-support";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";

const supportWhatsApp = getPublicSupportWhatsApp();

const channels = [
  {
    icon: "envelope-fill",
    color: "bg-blue-600",
    label: "Email us",
    value: "hello@dinaya.lk",
    desc: "For general enquiries, partnerships, and feedback.",
    href: "mailto:hello@dinaya.lk",
  },
  ...(supportWhatsApp
    ? [
        {
          icon: "whatsapp",
          color: "bg-amber-500",
          label: "WhatsApp",
          value: supportWhatsApp.label,
          desc: "Quickest way to reach us. Mon-Fri, 9 AM-6 PM.",
          href: supportWhatsApp.href,
        },
      ]
    : []),
  {
    icon: "geo-alt-fill",
    color: "bg-violet-500",
    label: "Based in",
    value: "Colombo, Sri Lanka",
    desc: "We're a Sri Lankan studio — local support, local hours.",
    href: null,
  },
];

const faqs = [
  {
    q: "How quickly will you respond?",
    a: supportWhatsApp
      ? "We aim to reply to all emails within one business day. WhatsApp messages are typically answered within a few hours during working hours."
      : "We aim to reply to all support emails within one business day.",
  },
  {
    q: "I found a bug. Who do I tell?",
    a: "Email us at hello@dinaya.lk with a short description and a screenshot if you have one. We take every report seriously.",
  },
  {
    q: "Can I request a feature?",
    a: "Yes — and we love hearing from users. Drop us a message with your idea and the business problem it solves. Most of our best features came from requests like yours.",
  },
  {
    q: "I need help setting up my booking page.",
    a: "Check the Help centre first — it covers most common setups step by step. If you're still stuck, reach out and we'll walk you through it.",
  },
];

type FormState = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<FormState>("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (status === "error") setStatus("idle");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      {/* Split — info pane + form pane, divided by a hairline */}
      <section className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-neutral-800">
        {/* Info pane */}
        <div className="px-6 lg:px-16 public-page-offset pb-16 lg:pb-24 lg:flex lg:flex-col lg:justify-center">
          <FadeContainer className="max-w-md lg:ml-auto lg:mr-12 xl:mr-20">
            <FadeDiv className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                <Icon name="chat-dots-fill" className="text-xs text-primary" />
                Get in touch
              </span>
            </FadeDiv>

            <h1 className="font-cal text-4xl md:text-5xl tracking-tight mb-5 text-balance">
              <FadeSpan>We&apos;d love to hear</FadeSpan> <FadeSpan className="text-primary">from you.</FadeSpan>
            </h1>

            <FadeDiv>
              <p className="text-muted-foreground leading-relaxed mb-12 max-w-sm">
                Questions, feedback, partnership ideas, or just a hello — we read every message
                and reply personally. No support bots, no ticket queues.
              </p>
            </FadeDiv>

            <div className="space-y-7 divide-y divide-gray-200 dark:divide-neutral-800">
              {channels.map((c) => (
                <FadeDiv key={c.label} className="flex items-start gap-4 pt-7 first:pt-0">
                  <div className={`flex items-center justify-center size-10 rounded-xl ${c.color} text-white shrink-0`}>
                    <Icon name={c.icon} className="text-base" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="font-cal text-lg tracking-tight text-foreground hover:text-primary transition-colors block mb-1">
                        {c.value}
                      </a>
                    ) : (
                      <p className="font-cal text-lg tracking-tight text-foreground mb-1">{c.value}</p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                </FadeDiv>
              ))}
            </div>
          </FadeContainer>
        </div>

        {/* Form pane */}
        <div className="px-6 lg:px-16 public-page-offset pt-16 lg:pt-24 pb-16 lg:pb-24 lg:flex lg:flex-col lg:justify-center">
          <div className="max-w-md lg:mr-auto lg:ml-12 xl:ml-20">
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-8 text-balance">
              Drop us a line.
            </h2>

            {status === "sent" ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/40 p-10 text-center flex flex-col items-center gap-4">
                <div className="flex items-center justify-center size-14 rounded-full bg-blue-600 text-white">
                  <Icon name="check-lg" className="text-2xl" />
                </div>
                <div>
                  <p className="font-cal text-xl tracking-tight mb-1">Message sent!</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll get back to you within one business day.
                  </p>
                </div>
                <button
                  onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
                  className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-[border-color,box-shadow] duration-150 ease-out"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" aria-busy={status === "sending"}>
                {status === "error" ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                  >
                    <Icon name="exclamation-circle" className="mt-0.5 shrink-0 text-sm" />
                    <span>
                      We couldn&apos;t send your message. Please try again or email{" "}
                      <a href="mailto:hello@dinaya.lk" className="font-medium underline underline-offset-2">
                        hello@dinaya.lk
                      </a>
                      .
                    </span>
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                    <input
                      id="name"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-150 ease-out"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-150 ease-out"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-150 ease-out appearance-none"
                  >
                    <option value="" disabled>Select a topic…</option>
                    <option value="general">General enquiry</option>
                    <option value="support">I need help</option>
                    <option value="bug">Bug report</option>
                    <option value="feature">Feature request</option>
                    <option value="partnership">Partnership / business</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind…"
                    className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-150 ease-out resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? (
                    <>
                      <Icon name="arrow-repeat" className="animate-spin text-sm" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message
                      <Icon name="arrow-right" className="text-sm" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-primary mb-4">Common questions</p>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight">Quick answers.</h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-neutral-800 border-y border-gray-200 dark:border-neutral-800">
          {faqs.map((f) => (
            <div key={f.q} className="py-6">
              <p className="font-semibold text-foreground mb-2">{f.q}</p>
              <p className="text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-4 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
          <div className="flex-shrink-0 flex items-center justify-center size-10 rounded-lg bg-amber-500 text-white">
            <Icon name="book" className="text-sm" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Need step-by-step guides instead?{" "}
            <Link href="/help" className="text-foreground font-medium hover:text-primary transition-colors underline underline-offset-4">
              Browse the Help centre →
            </Link>
          </p>
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
                Ready to go bookable?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Set up your booking page in five minutes. No card required for the trial.
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
