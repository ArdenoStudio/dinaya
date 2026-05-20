"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv } from "@/components/Fade";
import { LandingFooter } from "@/components/LandingFooter";

const categories = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "bi-rocket-takeoff",
    color: "blue",
    colorClasses: {
      bg: "bg-blue-50",
      ring: "ring-blue-200",
      icon: "bg-blue-600",
      text: "text-blue-700",
      accent: "bg-blue-600",
      pillBg: "bg-blue-50",
      pillText: "text-blue-700",
      pillRing: "ring-blue-200",
    },
    faqs: [
      {
        q: "How do I create my booking page?",
        a: "Sign up at dinaya.lk/register — it takes less than five minutes. Add your services, set your working hours, and your page goes live instantly at yourname.dinaya.lk. No technical knowledge needed.",
      },
      {
        q: "Is Dinaya really free?",
        a: "Yes, completely free for every Sri Lankan business. No credit card, no time limit, no hidden fees. We make money from optional Pro features — never from your bookings.",
      },
      {
        q: "What kinds of businesses can use Dinaya?",
        a: "Any appointment-based business: salons, barbers, beauty therapists, dental clinics, tuition classes, personal trainers, yoga studios, physiotherapists, and more. If clients book time with you, Dinaya works for you.",
      },
      {
        q: "How do I share my booking link with clients?",
        a: "Your link is at yourname.dinaya.lk. Put it in your Instagram bio, share it in WhatsApp, add it to your Facebook page — wherever your clients find you. One tap and they can book.",
      },
      {
        q: "Can I customise my booking page?",
        a: "Yes. Add your business name, photo, and description. List each of your services with duration and price. Set the working days and hours you want to accept bookings.",
      },
      {
        q: "Do my clients need to create an account?",
        a: "No. Clients book with just their name, phone number, and email — no sign-up required. This means less friction and more completed bookings for you.",
      },
    ],
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: "bi-calendar-check",
    color: "amber",
    colorClasses: {
      bg: "bg-amber-50",
      ring: "ring-amber-200",
      icon: "bg-amber-500",
      text: "text-amber-700",
      accent: "bg-amber-500",
      pillBg: "bg-amber-50",
      pillText: "text-amber-700",
      pillRing: "ring-amber-200",
    },
    faqs: [
      {
        q: "How do I manage my availability?",
        a: "Go to Dashboard → Availability. Set your working days and hours, add breaks, block off holidays, and set buffer time between appointments — so you're never double-booked.",
      },
      {
        q: "Can I block time off or add holidays?",
        a: "Yes. In your availability settings you can block any date or date range. Blocked dates won't appear on your booking page, so clients can't book those slots.",
      },
      {
        q: "What happens when a client books?",
        a: "You get an instant notification by email. The client gets a confirmation email with all the details. Both of you also receive a reminder before the appointment.",
      },
      {
        q: "Can I cancel or reschedule a booking?",
        a: "Yes, from Dashboard → Bookings. Find the booking, click to open it, and choose Cancel or Reschedule. The client is notified automatically by email.",
      },
      {
        q: "How does buffer time work?",
        a: "Buffer time adds a gap after each appointment before the next one can be booked. Set it per service — for example, 15 minutes after a haircut to clean up before the next client.",
      },
      {
        q: "Will I get double-booked?",
        a: "No. When a client picks a time, the slot is reserved immediately. Dinaya won't show that slot to anyone else, so double bookings are impossible.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: "bi-credit-card",
    color: "blue",
    colorClasses: {
      bg: "bg-blue-50",
      ring: "ring-blue-200",
      icon: "bg-blue-600",
      text: "text-blue-700",
      accent: "bg-blue-600",
      pillBg: "bg-blue-50",
      pillText: "text-blue-700",
      pillRing: "ring-blue-200",
    },
    faqs: [
      {
        q: "How do online payments work?",
        a: "Dinaya uses PayHere, Sri Lanka's leading payment gateway. When a client books, they can pay a deposit or the full amount online by card. Funds are settled to your bank account by PayHere on a regular schedule.",
      },
      {
        q: "Can I collect a deposit instead of the full amount?",
        a: "Yes. In your service settings, choose whether clients pay a fixed deposit, a percentage of the total, or the full amount upfront. This dramatically reduces no-shows.",
      },
      {
        q: "What are the payment fees?",
        a: "Dinaya charges zero transaction fees. PayHere applies their standard local rates — typically around 3.3% + LKR 30 per card transaction. We pass this through at cost with no markup.",
      },
      {
        q: "How do I issue a refund?",
        a: "Go to Dashboard → Bookings, open the relevant booking, and click Refund. You can refund the full amount or a partial amount. The refund is processed through PayHere within 5–7 working days.",
      },
      {
        q: "Do clients get a receipt?",
        a: "Yes. When a client pays online they receive an instant email receipt with the booking and payment details. You also see the payment status in your dashboard.",
      },
      {
        q: "Is it safe for clients to pay through my page?",
        a: "Yes. PayHere is PCI-DSS compliant and used by thousands of Sri Lankan businesses. Card details are never stored on our servers — they go directly to PayHere's secure environment.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: "bi-person-circle",
    color: "violet",
    colorClasses: {
      bg: "bg-violet-50",
      ring: "ring-violet-200",
      icon: "bg-violet-500",
      text: "text-violet-700",
      accent: "bg-violet-500",
      pillBg: "bg-violet-50",
      pillText: "text-violet-700",
      pillRing: "ring-violet-200",
    },
    faqs: [
      {
        q: "How do I change my business name or details?",
        a: "Go to Dashboard → Settings. You can update your business name, description, profile photo, and contact details any time. Changes appear on your booking page immediately.",
      },
      {
        q: "Can I change my booking link (yourname.dinaya.lk)?",
        a: "Your link is set when you register and can be changed once from Settings → Account. After that, contact support — we'll handle it manually to make sure no existing links break.",
      },
      {
        q: "How do I reset my password?",
        a: "On the login page, click 'Forgot password'. Enter your email and we'll send a reset link within a minute. Check your spam folder if it doesn't arrive.",
      },
      {
        q: "Can I have multiple staff or locations?",
        a: "Multi-staff calendars are coming in the Pro plan. Right now, each account manages one calendar. If you have multiple staff, they can each create their own free Dinaya account.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Account → Delete account. This permanently removes your page, all bookings, and your data. If you have upcoming bookings, please cancel them first to notify your clients.",
      },
      {
        q: "What data do you store about my clients?",
        a: "We store the name, email, and phone number that clients provide when booking. We don't sell this data. See our Privacy Policy for the full details on how data is handled and stored.",
      },
    ],
  },
];

const popularArticles = [
  { icon: "bi-rocket-takeoff", label: "Set up your booking page", cat: "getting-started" },
  { icon: "bi-credit-card", label: "How online payments work", cat: "payments" },
  { icon: "bi-calendar-x", label: "Cancel or reschedule a booking", cat: "bookings" },
  { icon: "bi-shield-lock", label: "Client data & privacy", cat: "account" },
  { icon: "bi-calendar2-range", label: "Block holidays & days off", cat: "bookings" },
  { icon: "bi-percent", label: "Collecting a deposit", cat: "payments" },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (faq) =>
            faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [search]);

  const displayed = activeCategory && !search
    ? filtered.filter((c) => c.id === activeCategory)
    : filtered;

  const totalResults = filtered.reduce((sum, c) => sum + c.faqs.length, 0);

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero / Search */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-blue-50/60 to-white">
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, #bfdbfe 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <FadeContainer className="flex flex-col items-center">
            <FadeDiv className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                <i className="bi bi-question-circle text-xs" />
                Help Center
              </span>
            </FadeDiv>

            <FadeDiv>
              <h1 className="font-cal text-4xl md:text-5xl tracking-tight mb-3">
                How can we help?
              </h1>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Search for answers, or browse by category below.
              </p>
            </FadeDiv>

            {/* Search bar */}
            <FadeDiv className="w-full max-w-xl">
              <div className="relative">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setActiveCategory(null);
                  }}
                  placeholder='Search help topics — e.g. refund, availability'
                  className="w-full rounded-xl border bg-white pl-10 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition placeholder:text-gray-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <i className="bi bi-x text-sm text-gray-500" />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-xs text-muted-foreground mt-2 text-left pl-1">
                  {totalResults === 0
                    ? "No results found."
                    : `${totalResults} result${totalResults === 1 ? "" : "s"} found`}
                </p>
              )}
            </FadeDiv>
          </FadeContainer>
        </div>
      </section>

      {/* Popular articles */}
      {!search && (
        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Popular articles
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {popularArticles.map((a) => {
              const cat = categories.find((c) => c.id === a.cat)!;
              return (
                <button
                  key={a.label}
                  onClick={() => {
                    setActiveCategory(a.cat);
                    document
                      .getElementById(a.cat)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.colorClasses.icon} text-white`}
                  >
                    <i className={`bi ${a.icon} text-xs`} />
                  </span>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-snug">
                    {a.label}
                  </span>
                  <i className="bi bi-chevron-right ml-auto text-xs text-gray-300 group-hover:text-gray-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Category tabs */}
      {!search && (
        <div className="sticky top-[65px] z-40 bg-white/90 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === null
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                All topics
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document
                      .getElementById(cat.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? `${cat.colorClasses.accent} text-white`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <i className={`bi ${cat.icon} text-xs`} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ sections */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 pb-20">
        {displayed.length === 0 && search && (
          <div className="text-center py-20">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <i className="bi bi-search text-xl text-gray-400" />
            </div>
            <h3 className="font-cal text-lg tracking-tight mb-2">No results for &ldquo;{search}&rdquo;</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
              Try different keywords, or reach out and we&apos;ll help directly.
            </p>
            <a
              href="mailto:support@dinaya.lk"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <i className="bi bi-envelope text-xs" />
              Email support
            </a>
          </div>
        )}

        {displayed.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.colorClasses.icon} text-white shrink-0`}
              >
                <i className={`bi ${cat.icon} text-base`} />
              </span>
              <div>
                <h2 className="font-cal text-xl tracking-tight">{cat.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {cat.faqs.length} article{cat.faqs.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Accordion */}
            <div className="rounded-2xl border overflow-hidden divide-y">
              {cat.faqs.map((faq, i) => (
                <details key={i} className="group bg-white">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 hover:bg-gray-50/70 transition-colors">
                    <span className="font-cal text-base tracking-tight text-gray-900 leading-snug">
                      {faq.q}
                    </span>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 group-open:bg-primary group-open:text-white group-open:border-primary transition-colors">
                      <svg
                        className="size-3 group-open:rotate-45 transition-transform duration-200"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact / Support CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 px-8 py-14 shadow-xl shadow-blue-900/10">
            <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/70 mb-4">
                  <i className="bi bi-headset text-xs" />
                  Still need help?
                </div>
                <h2 className="font-cal text-2xl md:text-3xl tracking-tight text-white mb-2">
                  Talk to a real person.
                </h2>
                <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                  Our team replies in Sinhala, Tamil, or English — usually within a few hours on business days.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <a
                  href="mailto:support@dinaya.lk"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg hover:bg-white/95 transition-colors"
                >
                  <i className="bi bi-envelope text-sm" />
                  Email support
                </a>
                <a
                  href="https://wa.me/94XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 text-white px-5 py-3 text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  <i className="bi bi-whatsapp text-sm" />
                  WhatsApp us
                </a>
              </div>
            </div>

            {/* Support hours note */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-6 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <i className="bi bi-clock text-xs" />
                Mon – Fri, 9 am – 6 pm (SL time)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="bi bi-translate text-xs" />
                Sinhala · Tamil · English
              </span>
              <span className="flex items-center gap-1.5">
                <i className="bi bi-lightning-charge text-xs" />
                Usually replies within 2 hours
              </span>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
