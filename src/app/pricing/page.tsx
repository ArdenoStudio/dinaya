import Link from "next/link";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { PublicNav } from "@/components/PublicNav";

const freeFeatures = [
  "Your own booking page at yourname.dinaya.lk",
  "Unlimited bookings, every month",
  "Online payments via PayHere",
  "Automated SMS & email reminders",
  "Custom availability & buffer time",
  "Simple dashboard for all your bookings",
  "Shareable link for Instagram, WhatsApp, Facebook",
  "Free updates forever",
];

const proFeatures = [
  "Everything in Free",
  "Multi-staff calendar & permissions",
  "Custom domain (e.g. book.yoursalon.lk)",
  "Remove Dinaya branding",
  "Advanced reports & exports",
  "Priority WhatsApp support",
];

const faqs = [
  {
    q: "Is Dinaya really free?",
    a: "Yes. Every Sri Lankan business can use the Free plan with no time limit, no card required, and no commission on your bookings. We make money from optional add-ons and a future Pro plan — never from your customers.",
  },
  {
    q: "Are there transaction fees?",
    a: "Dinaya doesn't charge a transaction fee on your bookings. PayHere (our payments partner) charges their standard local rates directly — typically 3.3% + LKR 30 per card transaction. We pass that through at cost.",
  },
  {
    q: "When does Pro launch?",
    a: "Pro is rolling out in stages later this year. If you're on the Free plan when Pro launches, you'll get a founding-member discount. Want early access? Just reach out from your dashboard.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime — and you'll never lose your bookings, link, or history. Free works forever for solo businesses; you only need Pro if you want multi-staff, branding control, or a custom domain.",
  },
  {
    q: "Do you offer refunds?",
    a: "Free is free, so there's nothing to refund. For paid add-ons, see our refund policy — we issue refunds for any unused billing period within 14 days.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <i className="bi bi-stars text-xs text-primary" />
              Free for every Sri Lankan business
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>Simple pricing.</FadeSpan>{" "}
            <FadeSpan className="text-primary">No surprises.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free, keep it free. Upgrade only when you outgrow it — never because we made you.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Free plan */}
          <div className="relative rounded-2xl border bg-white p-8 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-cal text-2xl tracking-tight">Free</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2 py-0.5 text-[11px] font-medium">
                <i className="bi bi-lightning-charge" style={{ fontSize: '0.75rem' }} />
                Current
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Everything a solo business needs to ditch WhatsApp booking.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-cal text-5xl tracking-tight">LKR 0</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Free forever. No credit card.</p>
            </div>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-5 py-3 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-[0_0_0_2px_rgba(0,0,0,0.04),0_0_14px_0_rgba(99,102,241,0.25)] transition-all duration-200 hover:shadow-primary/40 hover:shadow-lg mb-7"
            >
              Create your booking page
              <i className="bi bi-arrow-right text-sm" />
            </Link>

            <ul className="space-y-3 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <i className="bi bi-check text-primary" style={{ fontSize: '0.625rem' }} />
                  </span>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="relative rounded-2xl border bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-8 text-white flex flex-col shadow-xl shadow-indigo-900/20 overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-cal text-2xl tracking-tight">Pro</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white/80 ring-1 ring-white/20 px-2 py-0.5 text-[11px] font-medium">
                  Coming soon
                </span>
              </div>
              <p className="text-sm text-white/60 mb-6">
                For growing teams, multi-staff studios, and businesses that want their own brand.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-5xl tracking-tight">LKR 1,490</span>
                  <span className="text-sm text-white/60">/month</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Estimated launch price. Free until release.</p>
              </div>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-white/15 transition-colors mb-7"
              >
                Join the waitlist
                <i className="bi bi-arrow-right text-sm" />
              </Link>

              <ul className="space-y-3 text-sm">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/30">
                      <i className="bi bi-check text-primary" style={{ fontSize: '0.625rem' }} />
                    </span>
                    <span className="text-white/85">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Value strip */}
        <div className="mt-10 grid sm:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {[
            { icon: "bi-shield-check", title: "No commissions", desc: "Keep 100% of every booking — we don't take a cut." },
            { icon: "bi-credit-card", title: "No setup fees", desc: "Create your page and go live in 5 minutes." },
            { icon: "bi-chat-square-text", title: "Real human support", desc: "We reply on WhatsApp in Sinhala, Tamil, or English." },
          ].map((it) => (
            <div key={it.title} className="bg-white p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 mb-3">
                <i className={`bi ${it.icon} text-sm text-primary`} />
              </div>
              <h4 className="font-cal text-base mb-1 tracking-tight">{it.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compare table */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Compare plans
          </span>
          <h2 className="font-cal text-3xl mt-3 tracking-tight">What&apos;s included where</h2>
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="text-left font-medium text-gray-600 px-5 py-3 w-1/2">Feature</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Free</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { f: "Self-booking page", a: "Yes", b: "Yes", icon: "bi-calendar" },
                { f: "Online payments (PayHere)", a: "Yes", b: "Yes", icon: "bi-credit-card" },
                { f: "SMS + email reminders", a: "Yes", b: "Yes", icon: "bi-bell" },
                { f: "Booking dashboard", a: "Yes", b: "Yes", icon: "bi-grid" },
                { f: "Multi-staff calendar", a: "—", b: "Yes", icon: "bi-people" },
                { f: "Custom domain", a: "—", b: "Yes", icon: "bi-globe" },
                { f: "Remove Dinaya branding", a: "—", b: "Yes", icon: "bi-eye-slash" },
                { f: "Advanced reports & exports", a: "—", b: "Yes", icon: "bi-bar-chart" },
                { f: "Priority support", a: "Email", b: "WhatsApp", icon: "bi-headset" },
              ].map((row) => (
                <tr key={row.f} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="inline-flex items-center gap-2.5">
                      {row.icon ? <i className={`bi ${row.icon} text-xs text-gray-400`} /> : <span className="w-3.5 h-3.5 inline-block" />}
                      {row.f}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.a === "Yes" ? (
                      <i className="bi bi-check text-sm text-primary" />
                    ) : (
                      <span className="text-gray-700">{row.a}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.b === "Yes" ? (
                      <i className="bi bi-check text-sm text-primary" />
                    ) : (
                      <span className="text-gray-700">{row.b}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            FAQ
          </span>
          <h2 className="font-cal text-3xl mt-3 tracking-tight">Questions, answered</h2>
        </div>

        <div className="divide-y border-y">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                <span className="font-cal text-base tracking-tight text-gray-900">{item.q}</span>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-gray-500 group-open:bg-primary group-open:text-white group-open:border-primary transition-colors">
                  <svg
                    className="size-3 group-open:rotate-45 transition-transform"
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
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-10">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="pricing-cta-pattern" patternUnits="userSpaceOnUse" width="64" height="64">
                    {Array.from({ length: 17 }, (_, i) => {
                      const offset = i * 8;
                      return (
                        <path
                          key={i}
                          d={`M${-106 + offset} 110L${22 + offset} -18`}
                          stroke="white"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pricing-cta-pattern)" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Start free. Grow at your pace.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Your booking page goes live in five minutes. No card, no commitment.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
              >
                Create your page
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
