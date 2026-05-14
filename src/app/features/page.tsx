import Link from "next/link";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { PublicNav } from "@/components/PublicNav";

const bookingFeatures = [
  {
    icon: "bi-link-45deg",
    title: "Self-booking page",
    desc: "Your own page at yourname.dinaya.lk. Share it anywhere — Instagram bio, WhatsApp, Facebook — and let customers book in seconds.",
  },
  {
    icon: "bi-calendar",
    title: "Custom availability",
    desc: "Set your hours, block off personal time, and define exactly when clients can book. Changes take effect immediately.",
  },
  {
    icon: "bi-clock",
    title: "Buffer time",
    desc: "Add breathing room between appointments automatically. No more back-to-back bookings that leave you rushing.",
  },
  {
    icon: "bi-people",
    title: "Multi-staff calendar",
    desc: "Manage your whole team from one place. Each staff member gets their own schedule and bookings roll up to you.",
  },
  {
    icon: "bi-patch-check-fill",
    title: "Shareable link",
    desc: "One link for everything. Paste it in your bio, print it on a card, or text it directly — it always works.",
  },
];

const paymentFeatures = [
  {
    icon: "bi-credit-card",
    title: "PayHere checkout",
    desc: "Sri Lanka's most trusted payment gateway built in. Customers pay with cards or bank transfer without leaving your booking page.",
  },
  {
    icon: "bi-wallet2",
    title: "Deposit collection",
    desc: "Require a deposit to confirm a booking. Reduce no-shows without turning away genuine clients.",
  },
  {
    icon: "bi-patch-check-fill",
    title: "Full payment",
    desc: "Collect the full amount upfront for high-demand services. Money in your account before the appointment starts.",
  },
  {
    icon: "bi-arrow-counterclockwise",
    title: "Refunds & cancellations",
    desc: "Handle refunds cleanly from your dashboard. Set your cancellation policy and let Dinaya enforce it for you.",
  },
  {
    icon: "bi-bar-chart",
    title: "Revenue tracking",
    desc: "See exactly what you've earned, what's pending, and what's been refunded — all in one view.",
  },
  {
    icon: "bi-receipt",
    title: "Invoice receipts",
    desc: "Every paid booking generates a clean receipt. Customers get it automatically; you never have to send one manually.",
  },
];

const engagementFeatures = [
  {
    icon: "bi-chat-square-text",
    title: "SMS reminders",
    desc: "Automated texts sent before every appointment. Customers show up because they remembered — not because you chased them.",
  },
  {
    icon: "bi-envelope",
    title: "Email confirmations",
    desc: "Instant confirmation the moment a booking is made. Customers get all the details; you don't lift a finger.",
  },
  {
    icon: "bi-shield-exclamation",
    title: "No-show protection",
    desc: "Deposits and reminders working together mean far fewer empty slots. And when someone does cancel, you're protected.",
  },
  {
    icon: "bi-grid",
    title: "Client dashboard",
    desc: "Your clients can view, reschedule, or cancel upcoming appointments without calling you. Everyone saves time.",
  },
  {
    icon: "bi-clock-history",
    title: "Booking history",
    desc: "A full timeline of every appointment, payment, and cancellation. Perfect for spotting loyal customers or quiet periods.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Rebooking nudges",
    desc: "Friendly follow-ups that encourage clients to book again after their appointment. Repeat business on autopilot.",
  },
];

const highlights = [
  { stat: "5 min", label: "Average setup time" },
  { stat: "LKR 0", label: "Monthly cost on Free plan" },
  { stat: "0%", label: "Commission on bookings" },
  { stat: "24/7", label: "Booking page availability" },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-14 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <i className="bi bi-stars text-xs text-primary" />
              Built for Sri Lankan businesses
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>Everything in one</FadeSpan>{" "}
            <FadeSpan className="text-primary">booking link.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Booking, payments, and client engagement — all connected, all automated, all free to start.
            </p>
          </FadeDiv>

          <FadeDiv>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-6 py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-primary/40 hover:shadow-lg"
              >
                Create your booking page
                <i className="bi bi-arrow-right text-sm" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See pricing
              </Link>
            </div>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {highlights.map((h) => (
            <div key={h.label} className="bg-white px-6 py-7 text-center">
              <div className="font-cal text-3xl tracking-tight text-primary mb-1">{h.stat}</div>
              <div className="text-sm text-muted-foreground">{h.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking features */}
      <section className="max-w-6xl mx-auto px-6 pb-20" id="booking">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-xl ring-1 ring-emerald-100 bg-emerald-50/50 px-3.5 py-2 mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-white">
              <i className="bi bi-calendar text-xs" />
            </span>
            <span className="text-sm font-semibold text-gray-900">Booking</span>
          </div>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">
            Your calendar, open for business.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Give every client a frictionless way to book — no calls, no DMs, no back-and-forth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {bookingFeatures.map((f) => (
            <div key={f.title} className="group relative p-7 bg-white hover:bg-gradient-to-br hover:from-emerald-500/[0.03] hover:to-white transition-colors">
              <div className="relative mb-5 inline-flex">
                <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5">
                  <i className={`bi ${f.icon} text-[1.15rem] text-emerald-600`} />
                </div>
              </div>
              <h3 className="font-cal text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Payments features */}
      <section className="max-w-6xl mx-auto px-6 pb-20" id="payments">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-xl ring-1 ring-sky-100 bg-sky-50/50 px-3.5 py-2 mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500 text-white">
              <i className="bi bi-credit-card text-xs" />
            </span>
            <span className="text-sm font-semibold text-gray-900">Payments</span>
          </div>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">
            Get paid. Automatically.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            PayHere built right in. Collect deposits, full payments, or let clients pay on the day — your call.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {paymentFeatures.map((f) => (
            <div key={f.title} className="group relative p-7 bg-white hover:bg-gradient-to-br hover:from-sky-500/[0.03] hover:to-white transition-colors">
              <div className="relative mb-5 inline-flex">
                <div className="absolute inset-0 rounded-xl bg-sky-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-500/5">
                  <i className={`bi ${f.icon} text-[1.15rem] text-sky-600`} />
                </div>
              </div>
              <h3 className="font-cal text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Engagement features */}
      <section className="max-w-6xl mx-auto px-6 pb-20" id="engagement">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-xl ring-1 ring-pink-100 bg-pink-50/50 px-3.5 py-2 mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-500 text-white">
              <i className="bi bi-bell text-xs" />
            </span>
            <span className="text-sm font-semibold text-gray-900">Engagement</span>
          </div>
          <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-3">
            Clients show up. And come back.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Reminders, receipts, and follow-ups that run themselves — so you can focus on the work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {engagementFeatures.map((f) => (
            <div key={f.title} className="group relative p-7 bg-white hover:bg-gradient-to-br hover:from-pink-500/[0.03] hover:to-white transition-colors">
              <div className="relative mb-5 inline-flex">
                <div className="absolute inset-0 rounded-xl bg-pink-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/15 to-pink-500/5">
                  <i className={`bi ${f.icon} text-[1.15rem] text-pink-600`} />
                </div>
              </div>
              <h3 className="font-cal text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              <span className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            How it works
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            Live in five minutes.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            No developer needed, no complicated setup. Just three steps to your own booking page.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              number: "1",
              title: "Create your page",
              desc: "Sign up, add your services, set your hours. Takes under five minutes. Your page is live immediately at yourname.dinaya.lk.",
            },
            {
              number: "2",
              title: "Share your link",
              desc: "Post it in your Instagram bio, WhatsApp Status, or anywhere your clients already follow you. One link, everything they need.",
            },
            {
              number: "3",
              title: "Get booked — and paid",
              desc: "Clients pick a time and pay online. You get notified. No DMs, no spreadsheets, no chasing.",
            },
          ].map((step) => (
            <div key={step.number} className="flex flex-col">
              <div className="mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15">
                  <span className="font-cal text-2xl text-primary">{step.number}</span>
                </div>
              </div>
              <h3 className="font-cal text-xl mb-2 tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature checklist */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border bg-gray-50/50 p-8 md:p-12">
          <div className="text-center mb-10">
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              Everything included
            </span>
            <h2 className="font-cal text-3xl mt-3 tracking-tight">All features, free to start.</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              "Self-booking page",
              "Custom availability",
              "Buffer time",
              "Shareable link",
              "PayHere checkout",
              "Deposit collection",
              "Full payment",
              "Refunds & cancellations",
              "Revenue tracking",
              "Invoice receipts",
              "SMS reminders",
              "Email confirmations",
              "No-show protection",
              "Client dashboard",
              "Booking history",
              "Rebooking nudges",
              "Multi-staff calendar",
              "Free updates forever",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <i className="bi bi-check text-primary" style={{ fontSize: '0.625rem' }} />
                </span>
                <span className="text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Ready to stop taking bookings by DM?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Your booking page goes live in five minutes. No card required, no commitment.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
              >
                Create your page — it&apos;s free
                <i className="bi bi-arrow-right text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dinaya by Ardeno Studio
          </p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/legal/refund" className="hover:text-foreground transition-colors">Refund</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
