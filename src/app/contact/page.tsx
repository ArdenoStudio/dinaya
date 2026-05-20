"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { LandingFooter } from "@/components/LandingFooter";

const channels = [
  {
    icon: "bi-envelope-fill",
    color: "bg-blue-600",
    label: "Email us",
    value: "hello@dinaya.lk",
    desc: "For general enquiries, partnerships, and feedback.",
    href: "mailto:hello@dinaya.lk",
  },
  {
    icon: "bi-whatsapp",
    color: "bg-amber-500",
    label: "WhatsApp",
    value: "+94 77 000 0000",
    desc: "Quickest way to reach us. Mon–Fri, 9 AM–6 PM.",
    href: "https://wa.me/94770000000",
  },
  {
    icon: "bi-geo-alt-fill",
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
    a: "We aim to reply to all emails within one business day. WhatsApp messages are typically answered within a few hours during working hours.",
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    // Simulate async — wire up a real API route or service here
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <i className="bi bi-chat-dots-fill text-xs text-primary" />
              Get in touch
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>We&apos;d love to</FadeSpan>{" "}
            <FadeSpan className="text-primary">hear from you.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Questions, feedback, partnership ideas, or just a hello — we read every message and
              reply personally. No support bots, no ticket queues.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Contact channels */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {channels.map((c) => (
            <div key={c.label} className="group p-8 bg-white hover:bg-gray-50/60 transition-colors">
              <div className={`inline-flex items-center justify-center size-11 rounded-xl ${c.color} text-white mb-5`}>
                <i className={`bi ${c.icon} text-[1.1rem]`} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{c.label}</p>
              {c.href ? (
                <a
                  href={c.href}
                  className="font-cal text-lg tracking-tight text-foreground hover:text-primary transition-colors block mb-2"
                >
                  {c.value}
                </a>
              ) : (
                <p className="font-cal text-lg tracking-tight mb-2">{c.value}</p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t pt-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Form */}
          <div>
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              Send a message
            </span>
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 mb-8">
              Drop us a line.
            </h2>

            {status === "sent" ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-10 text-center flex flex-col items-center gap-4">
                <div className="flex items-center justify-center size-14 rounded-full bg-blue-600 text-white">
                  <i className="bi bi-check-lg text-2xl" />
                </div>
                <div>
                  <p className="font-cal text-xl tracking-tight mb-1">Message sent!</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll get back to you within one business day.
                  </p>
                </div>
                <button
                  onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
                  className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
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
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin text-sm" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message
                      <i className="bi bi-arrow-right text-sm" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              Common questions
            </span>
            <h2 className="font-cal text-3xl md:text-4xl tracking-tight mt-3 mb-8">
              Quick answers.
            </h2>

            <div className="space-y-px rounded-2xl overflow-hidden border border-gray-200/70 bg-gray-200/70">
              {faqs.map((f) => (
                <div key={f.q} className="bg-white px-7 py-6 hover:bg-gray-50/60 transition-colors">
                  <p className="font-semibold text-sm text-foreground mb-2">{f.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/50 p-5 flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center size-9 rounded-lg bg-amber-500 text-white mt-0.5">
                <i className="bi bi-book text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">Help centre</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Step-by-step guides for setting up your booking page, managing staff, and more.{" "}
                  <Link href="/help" className="text-amber-600 font-medium hover:underline underline-offset-4">
                    Browse articles →
                  </Link>
                </p>
              </div>
            </div>
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
                Ready to go bookable?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Set up your free booking page in five minutes. No card required.
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
                  href="/features"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/20 transition-colors"
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
