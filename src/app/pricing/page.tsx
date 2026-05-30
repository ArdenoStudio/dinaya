import type { Metadata } from "next";
import Link from "next/link";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { PublicNav } from "@/components/PublicNav";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { auth } from "@/auth";
import { annualSavingsPercent, getPlanConfigAsync } from "@/lib/plan";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Pricing — Start with a 14-Day Free Trial | Dinaya",
  description:
    "Try Dinaya free for 14 days — full access, no credit card. Then choose Pro or Max to keep your booking page live. Built for Sri Lankan businesses.",
};

const trialFeatures = [
  "Full access to every feature for 14 days",
  "All AI growth tools — Booking Autopilot, smart reminders, review engine & more",
  "Your own booking page at yourname.dinaya.lk",
  "Unlimited bookings and online payments via PayHere",
  "No credit card needed to start",
  "Keep all your data — subscribe anytime to stay live",
];

const proFeatures = [
  "Your booking page, unlimited bookings & PayHere payments",
  "Multi-staff calendar & permissions",
  "Custom domain (e.g. book.yoursalon.lk)",
  "Remove Dinaya branding",
  "Advanced reports & exports",
  "Priority WhatsApp support",
];

const maxFeatures = [
  "Everything in Pro",
  "All seven AI growth tools",
  "AI Booking Autopilot",
  "Smart reminder system",
  "Review engine",
  "Client Reactivation Campaign",
  "AI upsell assistant",
  "30-Day AI Content Machine",
  "VIP Loyalty Sequence",
  "AI Voice Receptionist setup eligibility",
  "Unlimited branch locations",
  "Per-branch AI workflow controls",
  "Priority rollout support for multi-branch teams",
];

function PlanCell({ value }: { value: string }) {
  return (
    <td className="px-5 py-3.5">
      <div className="flex items-center justify-center">
        {value === "Yes" ? (
          <Icon name="check" className="text-sm text-primary" />
        ) : (
          <span className="text-gray-700">{value}</span>
        )}
      </div>
    </td>
  );
}

const faqs = [
  {
    q: "How does the free trial work?",
    a: "Every new business starts with a 14-day free trial — full access to every feature, no credit card required. When the trial ends, choose Pro or Max to keep your booking page live. Your data is always safe.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Your dashboard switches to read-only and your public booking page pauses until you subscribe. Nothing is deleted — your bookings, link, and history are waiting. Subscribe to Pro or Max anytime to go live again instantly.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. You can create your booking page and use the full 14-day trial without entering any card details. You only pay when you choose to subscribe to Pro or Max.",
  },
  {
    q: "Are there transaction fees?",
    a: "Dinaya never takes a commission on your bookings. PayHere card fees (typically 3.3% + LKR 30) are charged by PayHere directly. Pro adds SMS and WhatsApp reminders; Max adds AI-timed smart reminders and the full AI growth toolkit.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime — and you'll never lose your bookings, link, or history. Move between Pro and Max from your dashboard billing page whenever your needs change.",
  },
  {
    q: "Do you offer refunds?",
    a: "The trial is free, so there's nothing to refund. For paid plans, see our refund policy — we issue refunds for any unused billing period within 14 days.",
    link: { href: "/legal/refund", label: "refund policy" },
  },
];

export default async function PricingPage() {
  const session = await auth();
  const upgradeHref = session?.user ? "/dashboard/billing" : "/register";
  const upgradeLabel = session?.user ? "Upgrade in dashboard" : "Get started";
  const config = await getPlanConfigAsync();
  const proAnnualSavings = annualSavingsPercent(config.proMonthlyPriceLkr, config.proAnnualPriceLkr);
  const maxAnnualSavings = annualSavingsPercent(config.maxMonthlyPriceLkr, config.maxAnnualPriceLkr);
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 public-page-offset pb-10 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <Icon name="stars" className="text-xs text-primary" />
              14-day free trial · No credit card
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>Simple pricing.</FadeSpan>{" "}
            <FadeSpan className="text-primary">No surprises.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Try everything free for 14 days — no card required. Keep your booking page live with Pro or Max.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Plans — equal card widths with even spacing; Pro centered in the row */}
      <section className="px-6 pb-20">
        <div className="flex justify-center">
          <div className="inline-flex w-full max-w-[96rem] flex-col items-stretch gap-5 sm:gap-6 lg:w-auto lg:flex-row lg:items-stretch">
          {/* Free trial */}
          <div className="relative flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col rounded-2xl border bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-cal text-2xl tracking-tight">Free trial</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-[11px] font-medium">
                <Icon name="lightning-charge" />
                14 days
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Try everything Dinaya can do — full access, no credit card.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-cal text-5xl tracking-tight">Free</span>
                <span className="text-sm text-muted-foreground">for 14 days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">No credit card. Then choose Pro or Max.</p>
            </div>

            <CTAPrimaryButton size="md" className="mb-7">Start your free trial</CTAPrimaryButton>

            <ul className="space-y-3 text-sm">
              {trialFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Icon name="check" className="text-primary" style={{ fontSize: '0.625rem' }} />
                  </span>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="relative z-10 flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 shadow-xl shadow-blue-200/60">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-blue-300/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-cal text-2xl tracking-tight">Pro</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                For growing teams — up to 3 branches and advanced operations.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-5xl tracking-tight">LKR {config.proMonthlyPriceLkr.toLocaleString("en-LK")}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  or LKR {config.proAnnualPriceLkr.toLocaleString("en-LK")}/year
                  {proAnnualSavings > 0 && (
                    <span className="ml-1 text-emerald-600">· save {proAnnualSavings}%</span>
                  )}
                </p>
              </div>

              <Link
                href={upgradeHref}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mb-7"
              >
                {upgradeLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <ul className="space-y-3 text-sm">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Icon name="check" className="text-primary" style={{ fontSize: '0.625rem' }} />
                    </span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

            </div>
          </div>

          {/* Max plan */}
          <div className="relative flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-yellow-50 to-amber-100 p-8 shadow-xl shadow-amber-200/60">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-amber-200/50 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-cal text-2xl tracking-tight">Max</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Everything in Pro — plus all seven AI growth tools, unlimited branches, and AI Voice Receptionist setup.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-5xl tracking-tight">LKR {config.maxMonthlyPriceLkr.toLocaleString("en-LK")}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  or LKR {config.maxAnnualPriceLkr.toLocaleString("en-LK")}/year
                  {maxAnnualSavings > 0 && (
                    <span className="ml-1 text-emerald-600">· save {maxAnnualSavings}%</span>
                  )}
                </p>
              </div>

              <Link
                href={upgradeHref}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mb-7"
              >
                {upgradeLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Multi-branch scale
              </p>
              <ul className="space-y-3 text-sm">
                {maxFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/25">
                      <Icon name="check" className="text-amber-600" style={{ fontSize: '0.625rem' }} />
                    </span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
        {/* Value strip */}
        <div className="grid sm:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {[
            { icon: "shield-check", title: "No commissions", desc: "Keep 100% of every booking — we don't take a cut." },
            { icon: "credit-card", title: "No setup fees", desc: "Create your page and go live in 5 minutes." },
            { icon: "chat-square-text", title: "Real human support", desc: "We reply on WhatsApp in Sinhala, Tamil, or English." },
          ].map((it) => (
            <div key={it.title} className="bg-white p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 mb-3">
                <Icon name={it.icon} className="text-sm text-primary" />
              </div>
              <h4 className="font-cal text-base mb-1 tracking-tight">{it.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Compare table */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Compare plans
          </span>
          <h2 className="font-cal text-3xl mt-3 tracking-tight">What&apos;s included where</h2>
        </div>

        <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-4 text-center text-sm text-gray-700">
          Every account starts with a <span className="font-semibold text-primary">14-day free trial</span> with full access — no card required. Here&apos;s what you keep on each plan after that.
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="text-left font-medium text-gray-600 px-5 py-3 w-1/2">Feature</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Pro</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { f: "Self-booking page", b: "Yes", icon: "calendar", c: "Yes" },
                { f: "Online payments (PayHere)", b: "Yes", icon: "credit-card", c: "Yes" },
                { f: "SMS + email reminders", b: "Yes", icon: "bell", c: "Yes" },
                { f: "Booking dashboard", b: "Yes", icon: "grid", c: "Yes" },
                { f: "Multi-staff calendar", b: "Yes", icon: "people", c: "Yes" },
                { f: "Branch locations", b: "Up to 3", icon: "geo-alt", c: "Unlimited" },
                { f: "Custom domain", b: "Yes", icon: "globe", c: "Yes" },
                { f: "Remove Dinaya branding", b: "Yes", icon: "eye-slash", c: "Yes" },
                { f: "Advanced reports & exports", b: "Yes", icon: "bar-chart", c: "Yes" },
                { f: "Priority support", b: "WhatsApp", icon: "headset", c: "WhatsApp" },
                { f: "AI Booking Autopilot", b: "—", icon: "robot", c: "Yes" },
                { f: "Smart reminder system", b: "—", icon: "bell-fill", c: "Yes" },
                { f: "Review engine", b: "—", icon: "star", c: "Yes" },
                { f: "Client Reactivation Campaign", b: "—", icon: "arrow-repeat", c: "Yes" },
                { f: "AI upsell assistant", b: "—", icon: "graph-up-arrow", c: "Yes" },
                { f: "30-Day AI Content Machine", b: "—", icon: "calendar3", c: "Yes" },
                { f: "VIP Loyalty Sequence", b: "—", icon: "gem", c: "Yes" },
                { f: "AI Voice Receptionist setup", b: "—", icon: "telephone", c: "Yes" },
              ].map((row) => (
                <tr key={row.f} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="inline-flex items-center gap-2.5">
                      {row.icon ? <Icon name={row.icon} className="text-xs text-gray-400" /> : <span className="w-3.5 h-3.5 inline-block" />}
                      {row.f}
                    </span>
                  </td>
                  <PlanCell value={row.b} />
                  <PlanCell value={row.c} />
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
                {"link" in item && item.link ? (
                  <>
                    {item.a.split(item.link.label)[0]}
                    <Link
                      href={item.link.href}
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {item.link.label}
                    </Link>
                    {item.a.split(item.link.label)[1]}
                  </>
                ) : (
                  item.a
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
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
                Try Dinaya free for 14 days.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Your booking page goes live in five minutes. No card, no commitment.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
              >
                Create your page
                <Icon name="arrow-right" className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
