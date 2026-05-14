import Link from "next/link";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { PublicNav } from "@/components/PublicNav";

const industries = [
  {
    id: "salons",
    icon: "bi-scissors",
    color: {
      bg: "bg-rose-500",
      light: "bg-rose-50/50",
      ring: "ring-rose-100",
      text: "text-rose-600",
      iconBg: "bg-gradient-to-br from-rose-500/15 to-rose-500/5",
      glow: "bg-rose-500/20",
      hover: "hover:from-rose-500/[0.03]",
      line: "via-rose-500/40",
    },
    label: "Salons & spas",
    headline: "Your chair is full. Your phone isn't.",
    sub: "Stop losing bookings to missed calls and messy WhatsApp threads. Give every client a clean, simple way to book and pay — so you can focus on the work.",
    pain: "Running a salon means your hands are always busy. Taking bookings by phone while a client is in your chair, managing last-minute cancellations via WhatsApp at 11pm — it's exhausting and unprofessional.",
    features: [
      {
        icon: "bi-link-45deg",
        title: "Booking page in minutes",
        desc: "List all your services with prices and duration. Clients pick what they want, choose a time, and confirm. No back and forth.",
      },
      {
        icon: "bi-credit-card",
        title: "Deposits stop no-shows",
        desc: "Require a small deposit to hold a slot. Clients who pay show up. Empty chairs cost you money — deposits prevent them.",
      },
      {
        icon: "bi-bell",
        title: "Automatic reminders",
        desc: "SMS and email reminders go out before every appointment. You never have to chase a client again.",
      },
      {
        icon: "bi-people",
        title: "Manage your whole team",
        desc: "Each stylist gets their own schedule. Clients book with their preferred person. You see everything from one dashboard.",
      },
    ],
    quote: "Dinaya completely replaced our WhatsApp booking system. Clients love being able to book and pay online. Our no-shows dropped overnight.",
    quoteName: "Amal Perera",
    quoteRole: "Owner, Amal's Salon · Colombo",
    quoteInitial: "A",
  },
  {
    id: "clinics",
    icon: "bi-heart-pulse",
    color: {
      bg: "bg-emerald-500",
      light: "bg-emerald-50/50",
      ring: "ring-emerald-100",
      text: "text-emerald-600",
      iconBg: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5",
      glow: "bg-emerald-500/20",
      hover: "hover:from-emerald-500/[0.03]",
      line: "via-emerald-500/40",
    },
    label: "Clinics",
    headline: "Patients booked. Admin handled.",
    sub: "Whether you're dental, physio, or a private doctor — your time is too valuable for phone tag. Let patients book themselves and focus entirely on care.",
    pain: "Clinic receptionists spend hours on the phone confirming, rescheduling, and chasing patients who forget their appointments. That time should go toward care, not coordination.",
    features: [
      {
        icon: "bi-calendar",
        title: "24/7 self-booking",
        desc: "Patients book when it suits them — evenings, weekends, whenever. You wake up to a full calendar, not a voicemail inbox.",
      },
      {
        icon: "bi-clock",
        title: "Buffer time between sessions",
        desc: "Add automatic gaps between appointments for notes, cleanup, or prep. No more running behind from the first hour.",
      },
      {
        icon: "bi-chat-square-text",
        title: "Confirmation & reminders",
        desc: "Every booking triggers an instant confirmation. A reminder goes out the day before. Fewer missed appointments, automatically.",
      },
      {
        icon: "bi-bar-chart",
        title: "Revenue & booking reports",
        desc: "See which services fill up fastest, track revenue by week, and spot quiet periods to run promotions — all from your dashboard.",
      },
    ],
    quote: "I never thought managing appointments could be this simple. My patients book online and pay a deposit instantly — no more phone tag.",
    quoteName: "Dr. Nisha Fernando",
    quoteRole: "NF Dental Clinic · Kandy",
    quoteInitial: "N",
  },
  {
    id: "tuition",
    icon: "bi-mortarboard",
    color: {
      bg: "bg-indigo-500",
      light: "bg-indigo-50/50",
      ring: "ring-indigo-100",
      text: "text-indigo-600",
      iconBg: "bg-gradient-to-br from-indigo-500/15 to-indigo-500/5",
      glow: "bg-indigo-500/20",
      hover: "hover:from-indigo-500/[0.03]",
      line: "via-indigo-500/40",
    },
    label: "Tuition classes",
    headline: "Fill your class. Not your inbox.",
    sub: "Tutors, music teachers, dance studios — stop managing bookings through parent WhatsApp groups. Let families book slots online in seconds.",
    pain: "Managing a tuition class means handling a dozen parent chats, remembering who paid this week, and juggling reschedules every time there's a holiday. There's a better way.",
    features: [
      {
        icon: "bi-people",
        title: "Per-student scheduling",
        desc: "Each student or class gets its own slot. Parents see exactly what's available and book without needing to message you.",
      },
      {
        icon: "bi-credit-card",
        title: "Collect fees upfront",
        desc: "Require full payment at booking. No more chasing parents for the monthly fee — it's handled before the lesson starts.",
      },
      {
        icon: "bi-bell",
        title: "Reminders for parents",
        desc: "Automated SMS reminders go to parents before each session. Fewer last-minute 'oh we forgot' cancellations.",
      },
      {
        icon: "bi-calendar",
        title: "Block out holidays easily",
        desc: "Mark term breaks and public holidays in seconds. Your booking page updates automatically — no parent questions needed.",
      },
    ],
    quote: "My tuition class fills up without me managing WhatsApp groups. Parents just click the link and book their child's slot.",
    quoteName: "Priya Wickramasinghe",
    quoteRole: "Piano & Theory Teacher · Gampaha",
    quoteInitial: "P",
  },
  {
    id: "freelancers",
    icon: "bi-briefcase",
    color: {
      bg: "bg-amber-500",
      light: "bg-amber-50/50",
      ring: "ring-amber-100",
      text: "text-amber-600",
      iconBg: "bg-gradient-to-br from-amber-500/15 to-amber-500/5",
      glow: "bg-amber-500/20",
      hover: "hover:from-amber-500/[0.03]",
      line: "via-amber-500/40",
    },
    label: "Freelancers",
    headline: "Your time is your product. Protect it.",
    sub: "Consultants, coaches, and service providers — stop giving away free time to unqualified leads and no-show calls. Let serious clients book and pay upfront.",
    pain: "Freelancers lose hours every week to discovery calls that go nowhere, clients who reschedule at the last minute, and chasing invoices after the work is done.",
    features: [
      {
        icon: "bi-link-45deg",
        title: "One link for everything",
        desc: "Share your dinaya.lk page in your email signature, LinkedIn, and Instagram. Clients see your services, rates, and availability in one place.",
      },
      {
        icon: "bi-credit-card",
        title: "Get paid before you show up",
        desc: "Require a deposit or full payment at booking. Only serious clients make it to the call — time-wasters don't bother paying.",
      },
      {
        icon: "bi-clock",
        title: "Set your own hours",
        desc: "Block off focused work time, personal days, and holidays. Your booking page only shows when you actually want to be available.",
      },
      {
        icon: "bi-chat-square-text",
        title: "Automated confirmations",
        desc: "Every booked session gets a confirmation with all the details. You never have to send a calendar invite or follow-up message manually.",
      },
    ],
    quote: "I used to lose hours just coordinating calls. Now clients pick a time, pay, and I get a notification. It's transformed how I work.",
    quoteName: "Rohan Silva",
    quoteRole: "Business Consultant · Colombo",
    quoteInitial: "R",
  },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Built for Sri Lankan businesses
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>One platform,</FadeSpan>{" "}
            <FadeSpan className="text-primary">every business type.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Dinaya works for salons, clinics, tuition classes, freelancers, and more. Same product, tailored to how your business actually runs.
            </p>
          </FadeDiv>

          {/* Industry jump links */}
          <FadeDiv>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {industries.map((ind) => (
                <a
                  key={ind.id}
                  href={`#${ind.id}`}
                  className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md ${ind.color.bg} text-white`}>
                    <i className={`bi ${ind.icon} text-[10px]`} />
                  </span>
                  {ind.label}
                </a>
              ))}
              <span className="px-4 py-2 text-sm text-muted-foreground">& more</span>
            </div>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Industry sections */}
      {industries.map((ind, i) => (
        <section
          key={ind.id}
          id={ind.id}
          className={`py-20 px-6 ${i % 2 === 1 ? "bg-gray-50/60" : ""}`}
        >
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="max-w-2xl mb-12">
              <div className={`inline-flex items-center gap-2 rounded-xl ring-1 ${ind.color.ring} ${ind.color.light} px-3.5 py-2 mb-5`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${ind.color.bg} text-white`}>
                  <i className={`bi ${ind.icon} text-xs`} />
                </span>
                <span className="text-sm font-semibold text-gray-900">{ind.label}</span>
              </div>

              <h2 className="font-cal text-3xl md:text-4xl tracking-tight mb-4">
                {ind.headline}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                {ind.sub}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-gray-200 pl-4">
                {ind.pain}
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70 mb-10">
              {ind.features.map((f) => (
                <div
                  key={f.title}
                  className={`group relative p-7 bg-white hover:bg-gradient-to-br ${ind.color.hover} hover:to-white transition-colors`}
                >
                  <div className="relative mb-5 inline-flex">
                    <div className={`absolute inset-0 rounded-xl ${ind.color.glow} blur-md opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`relative flex items-center justify-center w-11 h-11 rounded-xl ${ind.color.iconBg}`}>
                      <i className={`bi ${f.icon} text-[1.15rem] ${ind.color.text}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  <span className={`absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent ${ind.color.line} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                </div>
              ))}
            </div>

            {/* Testimonial + CTA row */}
            <div className="flex flex-col md:flex-row gap-6">
              <blockquote className="flex-1 rounded-2xl border bg-white p-6">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  &ldquo;{ind.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ind.color.bg} text-white text-sm font-semibold`}>
                    {ind.quoteInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ind.quoteName}</p>
                    <p className="text-xs text-muted-foreground">{ind.quoteRole}</p>
                  </div>
                </div>
              </blockquote>

              <div className="md:w-64 rounded-2xl border bg-white p-6 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Ready to get started?</p>
                  <ul className="space-y-1.5 mb-5">
                    {["Free to start", "Live in 5 minutes", "No credit card"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <i className="bi bi-check text-xs text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md"
                >
                  Create your page
                  <i className="bi bi-arrow-right text-sm" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="solutions-cta-pattern" patternUnits="userSpaceOnUse" width="64" height="64">
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
                <rect width="100%" height="100%" fill="url(#solutions-cta-pattern)" />
              </svg>
            </div>
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Your business type. Your booking page.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Join salons, clinics, tutors, and freelancers across Sri Lanka who&apos;ve replaced WhatsApp chaos with Dinaya.
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
