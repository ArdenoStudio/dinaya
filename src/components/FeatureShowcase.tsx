"use client";

import { useState, useEffect, useRef } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

// ─── Cursor SVG ───────────────────────────────────────────────────────────────
function CursorSVG() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <path
        d="M2.5 2L2.5 17L6 13.5L8.5 20L10.5 19L8 12.5L14 12.5L2.5 2Z"
        fill="white"
        stroke="#111827"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Highlighted verb pill ────────────────────────────────────────────────────
function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-0.5 text-primary font-medium mx-1 whitespace-nowrap">
      <Icon name={icon} className="text-sm shrink-0" />
      {children}
    </span>
  );
}


// ─── Mockup 1: Booking ────────────────────────────────────────────────────────
function BookingMockup() {
  const slots = ["9:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "3:30 PM"];
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [btnPressed, setBtnPressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);
  const btnRef = useRef<HTMLDivElement>(null);

  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const cScale = useMotionValue(1);
  const cOpacity = useMotionValue(0);

  const getPos = (el: HTMLElement | null) => {
    if (!el || !containerRef.current) return { x: 0, y: 0 };
    const cr = containerRef.current.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { x: er.left - cr.left + er.width / 2, y: er.top - cr.top + er.height / 2 };
  };

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const run = async () => {
      await sleep(1000);
      while (alive) {
        // Reset state
        setSelectedSlot(-1);
        setBtnPressed(false);
        const p2 = getPos(slotRefs.current[2]);
        cx.set(p2.x + 28);
        cy.set(p2.y + 36);
        cOpacity.set(0);
        cScale.set(1);

        await sleep(400);
        if (!alive) break;

        // Fade in
        await animate(cOpacity, 1, { duration: 0.22 });

        // Drift toward 9:00 AM
        const p0 = getPos(slotRefs.current[0]);
        await Promise.all([
          animate(cx, p0.x, { duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p0.y, { duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await sleep(320);
        if (!alive) break;

        // Move to 10:30 AM
        const p1 = getPos(slotRefs.current[1]);
        await Promise.all([
          animate(cx, p1.x, { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p1.y, { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }),
        ]);

        // Click — compress then bounce back
        await animate(cScale, 0.68, { duration: 0.08 });
        setSelectedSlot(1);
        await animate(cScale, 1.06, { duration: 0.13 });
        await animate(cScale, 1, { duration: 0.1 });

        await sleep(520);
        if (!alive) break;

        // Move to Confirm button
        const pb = getPos(btnRef.current);
        await Promise.all([
          animate(cx, pb.x, { duration: 0.58, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, pb.y, { duration: 0.58, ease: [0.25, 0.1, 0.25, 1] }),
        ]);

        // Click button
        await animate(cScale, 0.68, { duration: 0.08 });
        setBtnPressed(true);
        await animate(cScale, 1, { duration: 0.15 });

        await sleep(700);
        if (!alive) break;

        // Fade out
        await animate(cOpacity, 0, { duration: 0.3 });
        setBtnPressed(false);

        await sleep(1400);
      }
    };

    run();
    return () => { alive = false; };
  }, [cOpacity, cScale, cx, cy]);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs mx-auto">
      <div className="rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-primary/10 overflow-hidden" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="bg-primary px-4 py-3 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <Icon name="scissors" className="text-white text-xs" />
          </div>
          <div>
            <div className="text-white font-semibold text-xs">Dilini&apos;s Beauty Studio</div>
            <div className="text-white/70 text-[11px]">dilini.dinaya.lk</div>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-900">Haircut &amp; Style</div>
              <div className="text-[11px] text-muted-foreground">45 min</div>
            </div>
            <div className="text-xs font-bold text-primary">Rs. 2,500</div>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Thu, May 22</div>
          <div className="grid grid-cols-3 gap-1.5">
            {slots.map((s, i) => (
              <div
                key={s}
                ref={el => { slotRefs.current[i] = el; }}
                className={`rounded-lg border px-1.5 py-1.5 text-center text-[11px] font-medium transition-all duration-200 ${
                  i === selectedSlot
                    ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 pb-4">
          <motion.div
            ref={btnRef}
            animate={btnPressed ? { scale: 0.96, opacity: 0.88 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="rounded-xl bg-primary py-2.5 text-center text-xs font-semibold text-white"
          >
            Confirm &amp; Pay deposit
          </motion.div>
        </div>
      </div>

      {/* Animated cursor */}
      <motion.div
        className="pointer-events-none absolute top-0 left-0 z-50 drop-shadow-sm"
        style={{ x: cx, y: cy, scale: cScale, opacity: cOpacity, translateX: "-3px", translateY: "-2px" }}
      >
        <CursorSVG />
      </motion.div>
    </div>
  );
}

// ─── Mockup 2: Payment ────────────────────────────────────────────────────────
function PaymentMockup() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-2.5">
      <div className="rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-green-500/10 overflow-hidden" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
            <Icon name="check-circle" className="text-white text-sm" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-xs">Deposit received</div>
            <div className="text-white/80 text-[11px]">Via PayHere · Visa ••••4242</div>
          </div>
          <div className="text-white font-bold text-sm">Rs. 1,250</div>
        </div>
        <div className="px-4 py-3 space-y-1.5">
          {[
            { label: "Client", value: "Kavya Senanayake" },
            { label: "Service", value: "Haircut & Style" },
            { label: "Appointment", value: "Thu 22 May · 10:30 AM" },
            { label: "Balance on arrival", value: "Rs. 1,250" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-gray-900">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 shadow-sm w-fit mx-auto" style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10">
          <Icon name="bell" className="text-[10px] text-primary" />
        </div>
        <span className="text-xs text-gray-700 font-medium">You&apos;ve been notified</span>
      </div>
    </div>
  );
}

// ─── Mockup 3: Reminders ──────────────────────────────────────────────────────
function RemindersMockup() {
  const reminders = [
    { name: "Kavya S.", time: "10:30 AM", service: "Haircut & Style",   status: "Confirmed ✓", delay: 0.1 },
    { name: "Nimal P.", time: "2:00 PM",  service: "Facial Treatment",  status: "Delivered",    delay: 0.2 },
    { name: "Amali K.", time: "3:30 PM",  service: "Eyebrow Threading", status: "Delivered",    delay: 0.3 },
  ];
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-violet-100">
            <Icon name="bell" className="text-[10px] text-violet-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Automated reminders</span>
        </div>
        <span className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
          3 sent today
        </span>
      </div>
      {reminders.map((r) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: r.delay, duration: 0.35, ease: "easeOut" }}
          className="flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/80 px-3 py-2.5 shadow-sm"
          style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
            {r.name[0]}{r.name.split(" ")[1]?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900">{r.name}</span>
              <span className="text-[11px] text-muted-foreground">{r.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground truncate">{r.service}</span>
              <span className="text-[11px] text-green-600 font-medium ml-2 shrink-0">{r.status}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Mockup 4: Dashboard ──────────────────────────────────────────────────────
function DashboardMockup() {
  const bookings = [
    { time: "10:30", name: "Kavya S.",  service: "Haircut & Style",   amount: "Rs. 2,500", color: "bg-primary/10 text-primary" },
    { time: "12:00", name: "Ravi P.",   service: "Facial Treatment",  amount: "Rs. 3,800", color: "bg-violet-100 text-violet-700" },
    { time: "14:30", name: "Amali K.",  service: "Eyebrow Threading", amount: "Rs. 800",   color: "bg-amber-100 text-amber-700" },
    { time: "16:00", name: "Nimal S.",  service: "Haircut & Style",   amount: "Rs. 2,500", color: "bg-green-100 text-green-700" },
  ];
  return (
    <div className="w-full max-w-xs mx-auto rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-amber-500/10 overflow-hidden" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="grid grid-cols-3 divide-x border-b">
        {[{ label: "Today", value: "4" }, { label: "Revenue", value: "Rs. 9,600" }, { label: "No-shows", value: "0" }].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <div className="text-sm font-bold text-gray-900">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="divide-y">
        {bookings.map((b, i) => (
          <motion.div
            key={b.name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 + i * 0.07 }}
            className="flex items-center gap-2.5 px-3 py-2.5"
          >
            <span className="text-[11px] font-mono text-muted-foreground w-9 shrink-0">{b.time}</span>
            <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${b.color}`}>
              {b.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{b.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{b.service}</div>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 shrink-0">{b.amount}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature card data ────────────────────────────────────────────────────────
const features = [
  {
    num: "01", tag: "SELF-BOOKING",
    headlinePre: "Dinaya", verb: { icon: "calendar-check", label: "books" }, headlinePost: "clients while you sleep.",
    desc: "Your own page at yourname.dinaya.lk. Clients pick a time and pay — without a single WhatsApp message.",
    mockup: <BookingMockup />,
    mockupBg: "bg-blue-300/20",
  },
  {
    num: "02", tag: "PAYMENTS",
    headlinePre: "Dinaya", verb: { icon: "credit-card", label: "collects" }, headlinePost: "deposits before they arrive.",
    desc: "Accept a deposit via PayHere the moment a booking is made. No-shows drop to zero, overnight.",
    mockup: <PaymentMockup />,
    mockupBg: "bg-green-300/20",
  },
  {
    num: "03", tag: "REMINDERS",
    headlinePre: "Dinaya", verb: { icon: "bell", label: "reminds" }, headlinePost: "clients so you never have to.",
    desc: "SMS and email reminders go out automatically before every appointment. Clients confirm. You relax.",
    mockup: <RemindersMockup />,
    mockupBg: "bg-violet-300/20",
  },
  {
    num: "04", tag: "DASHBOARD",
    headlinePre: "Dinaya", verb: { icon: "grid", label: "tracks" }, headlinePost: "every booking in one place.",
    desc: "See your full day at a glance — who's coming, what they booked, and how much you've earned.",
    mockup: <DashboardMockup />,
    mockupBg: "bg-amber-300/20",
  },
];

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, i }: { f: typeof features[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.12 }}
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.68)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: `
          inset 0 0 0 1px rgba(255, 255, 255, 0.60),
          inset 1.5px 2.5px 0px -2px rgba(255, 255, 255, 0.92),
          inset -2px -2px 0px -2px rgba(255, 255, 255, 0.72),
          inset -3px -8px 1px -6px rgba(255, 255, 255, 0.50),
          inset 0px 3px 4px -2px rgba(0, 0, 0, 0.08),
          0px 2px 8px 0px rgba(0, 0, 0, 0.05),
          0px 12px 40px 0px rgba(0, 0, 0, 0.09)
        `,
      }}
    >
      {/* Mockup area */}
      <div
        className={`${f.mockupBg} px-8 py-10 flex items-center justify-center`}
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {f.mockup}
      </div>

      {/* Text area */}
      <div className="px-7 py-6 border-t border-white/50">
        <div className="text-xs font-bold tracking-widest text-muted-foreground mb-3">
          {f.num} · {f.tag}
        </div>
        <h3 className="font-cal text-2xl tracking-tight text-balance text-gray-900 leading-snug">
          {f.headlinePre}
          <Pill icon={f.verb.icon}>{f.verb.label}</Pill>
          {f.headlinePost}
        </h3>
        <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed text-pretty">
          {f.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function FeatureShowcase() {
  return (
    <div className="relative overflow-hidden">
      {/* Background blobs for glass to blur through */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-48 -right-24 size-[700px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -bottom-24 -left-40 size-[600px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 size-[400px] -translate-y-1/2 rounded-full bg-amber-400/6 blur-[100px]" />
      </div>
    <section className="max-w-6xl mx-auto px-6 py-20 border-t">
      <div className="text-center mb-14">
        <span className="relative text-sm font-semibold tracking-tight text-primary">
          <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
          What Dinaya does
        </span>
        <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
          Everything your booking needs
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Four things that work together — so you stop chasing clients and start filling your calendar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {features.map((f, i) => (
          <FeatureCard key={f.num} f={f} i={i} />
        ))}
      </div>
    </section>
    </div>
  );
}
