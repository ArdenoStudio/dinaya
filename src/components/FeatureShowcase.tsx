"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, animate, useMotionValue } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

// ─── Cursor SVG ───────────────────────────────────────────────────────────────
function CursorSVG() {
  return (
    <svg width="20" height="24" viewBox="0 0 28 28" fill="none">
      <path
        d="M4.5 2.3C4.5 1.69 5.23 1.39 5.67 1.81L23.2 18.2C23.67 18.64 23.36 19.43 22.72 19.44L12.7 19.53L5.67 26.01C5.23 26.41 4.5 26.1 4.5 25.5V2.3Z"
        fill="#111111"
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

function createManagedSleep() {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();

  return {
    sleep(ms: number) {
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          timeouts.delete(timeout);
          resolve();
        }, ms);
        timeouts.add(timeout);
      });
    },
    clear() {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    },
  };
}

function RollingValue({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`relative inline-flex h-[1.2em] overflow-hidden align-baseline ${className ?? ""}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="block leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
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
    const { sleep, clear } = createManagedSleep();

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
    return () => {
      alive = false;
      clear();
    };
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
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % 3);
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  const isPaid = phase >= 1;
  const notified = phase === 2;

  return (
    <div className="w-full max-w-xs mx-auto space-y-2.5">
      <div className="rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-green-500/10 overflow-hidden" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <motion.div
          animate={{
            background: isPaid
              ? "linear-gradient(90deg, rgb(34 197 94), rgb(16 185 129))"
              : "linear-gradient(90deg, rgb(245 158 11), rgb(249 115 22))",
          }}
          transition={{ duration: 0.35 }}
          className="px-4 py-3 flex items-center gap-2.5"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
            <Icon name={isPaid ? "check-circle" : "clock-history"} className="text-white text-sm" />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-xs">{isPaid ? "Deposit received" : "Waiting for payment"}</div>
            <div className="text-white/80 text-[11px]">Via PayHere · Visa ••••4242</div>
          </div>
          <div className="text-white font-bold text-sm">{isPaid ? "Rs. 1,250" : "Pending"}</div>
        </motion.div>
        <div className="px-4 py-3 space-y-1.5">
          {[
            { label: "Client", value: "Kavya Senanayake" },
            { label: "Service", value: "Haircut & Style" },
            { label: "Appointment", value: "Thu 22 May · 10:30 AM" },
            { label: "Balance on arrival", value: "Rs. 1,250" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-gray-900">
                {r.label === "Balance on arrival" && !isPaid ? "Rs. 2,500" : r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <motion.div
        animate={notified ? { opacity: 1, y: 0 } : { opacity: 0.45, y: 4 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 shadow-sm w-fit mx-auto"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10">
          <Icon name={notified ? "check-circle" : "bell"} className="text-[10px] text-primary" />
        </div>
        <span className="text-xs text-gray-700 font-medium">
          {notified ? "Owner notified instantly" : "Sending owner notification..."}
        </span>
      </motion.div>
    </div>
  );
}

// ─── Mockup 3: Reminders ──────────────────────────────────────────────────────
function RemindersMockup() {
  const reminders = [
    { name: "Kavya S.", time: "10:30 AM", service: "Haircut & Style" },
    { name: "Nimal P.", time: "2:00 PM", service: "Facial Treatment" },
    { name: "Amali K.", time: "3:30 PM", service: "Eyebrow Threading" },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % (reminders.length + 2));
    }, 1450);
    return () => window.clearInterval(id);
  }, [reminders.length]);

  const sendingIndex = step < reminders.length ? step : -1;
  const sentCount = Math.min(step, reminders.length);

  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            key={`reminder-bell-${step}`}
            animate={sendingIndex >= 0 ? { rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex size-6 items-center justify-center rounded-full bg-violet-100"
          >
            <Icon name="bell" className="text-[10px] text-violet-600" />
          </motion.div>
          <span className="text-xs font-semibold text-gray-700">Automated reminders</span>
        </div>
        <motion.span
          key={`sent-count-${sentCount}`}
          initial={{ scale: 0.86, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5"
        >
          {sentCount} sent today
        </motion.span>
      </div>
      {reminders.map((r, i) => {
        const isSent = i < sentCount;
        const isSending = i === sendingIndex;
        const status = (() => {
          if (isSending) return "Sending";
          if (!isSent) return "Queued";
          if (i === 0 && sentCount >= 2) return "Confirmed ✓";
          return "Delivered";
        })();
        const statusTone = status === "Confirmed ✓"
          ? "text-green-600"
          : status === "Delivered"
            ? "text-emerald-600"
            : isSending
              ? "text-primary"
              : "text-muted-foreground";

        return (
        <motion.div
          key={r.name}
          animate={{
            opacity: isSent || isSending ? 1 : 0.62,
            x: isSending ? 4 : 0,
            y: isSending ? -1 : 0,
            scale: isSending ? 1.01 : 1,
            boxShadow: isSending
              ? "0 8px 24px rgba(37,99,235,0.12)"
              : "0 1px 2px rgba(15,23,42,0.03)",
          }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/80 px-3 py-2.5 shadow-sm"
          style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        >
          <motion.div
            animate={isSending ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, repeat: isSending ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700"
          >
            {r.name[0]}{r.name.split(" ")[1]?.[0]}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900">{r.name}</span>
              <span className="text-[11px] text-muted-foreground">{r.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground truncate">{r.service}</span>
              <motion.span
                key={`${r.name}-${status}`}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`text-[11px] font-medium ml-2 shrink-0 inline-flex items-center gap-0.5 ${statusTone} ${isSending ? "rounded-full bg-primary/10 px-1.5 py-0.5" : ""}`}
              >
                {status}
                {isSending && (
                  <span className="inline-flex items-center gap-[2px] ml-[1px]">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={`${r.name}-dot-${dot}`}
                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -1, 0] }}
                        transition={{ duration: 0.65, repeat: Number.POSITIVE_INFINITY, delay: dot * 0.12, ease: "easeInOut" }}
                        className="block size-[2.5px] rounded-full bg-current"
                      />
                    ))}
                  </span>
                )}
              </motion.span>
            </div>
          </div>
        </motion.div>
      );})}
    </div>
  );
}

// ─── Mockup 4: Dashboard ──────────────────────────────────────────────────────
function DashboardMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  const bookings = [
    { time: "10:30", name: "Kavya S.",  service: "Haircut & Style",   amount: "Rs. 2,500", color: "bg-primary/10 text-primary" },
    { time: "12:00", name: "Ravi P.",   service: "Facial Treatment",  amount: "Rs. 3,800", color: "bg-violet-100 text-violet-700" },
    { time: "14:30", name: "Amali K.",  service: "Eyebrow Threading", amount: "Rs. 800",   color: "bg-amber-100 text-amber-700" },
    { time: "16:00", name: "Nimal S.",  service: "Haircut & Style",   amount: "Rs. 2,500", color: "bg-green-100 text-green-700" },
  ];
  const showNewBooking = step >= 2;
  const visibleBookings = showNewBooking
    ? [bookings[3], bookings[0], bookings[1], bookings[2]]
    : bookings.slice(0, 3);

  return (
    <div className="relative w-full max-w-xs mx-auto pt-8">
      <motion.div
        initial={false}
        animate={showNewBooking ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none absolute left-3 right-3 top-0 z-20 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] text-primary font-semibold"
      >
        New booking received · 16:00
      </motion.div>

      <div className="rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-amber-500/10 overflow-hidden relative h-[212px] flex flex-col" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="grid grid-cols-3 divide-x border-b">
        {[
          { label: "Today", value: showNewBooking ? "4" : "3" },
          { label: "Revenue", value: showNewBooking ? "Rs. 9,600" : "Rs. 7,100" },
          { label: "No-shows", value: "0" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 text-center">
            <RollingValue value={s.value} className="text-sm font-bold text-gray-900 tabular-nums" />
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
        <div className="relative divide-y flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleBookings.map((b, i) => {
              const isNewest = showNewBooking && b.name === "Nimal S.";
              const rowDelay = showNewBooking ? i * 0.03 : 0.04 + i * 0.05;

              return (
                <motion.div
                  key={b.name}
                  layout="position"
                  initial={isNewest ? { opacity: 0, y: -16 } : { opacity: 0, y: 8 }}
                  animate={
                    isNewest
                      ? {
                          opacity: 1,
                          y: 0,
                          backgroundColor: ["rgba(37,99,235,0.14)", "rgba(37,99,235,0.06)", "rgba(37,99,235,0)"],
                        }
                      : { opacity: 1, y: 0, backgroundColor: "rgba(37,99,235,0)" }
                  }
                  exit={isNewest ? { opacity: 0, y: -8 } : { opacity: 0, y: 6 }}
                  transition={{
                    delay: rowDelay,
                    duration: isNewest ? 0.42 : 0.25,
                    ease: [0.22, 1, 0.36, 1],
                    layout: { type: "spring", stiffness: 420, damping: 30 },
                  }}
                  className="relative flex items-center gap-2.5 px-3 py-2.5"
                >
                  {isNewest && (
                    <span className="absolute right-2 top-2 inline-block size-1.5 rounded-full bg-primary" />
                  )}
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
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Mockup 5: Availability ──────────────────────────────────────────────────
function AvailabilityMockup() {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const thursdayRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<HTMLButtonElement>(null);
  const bufferOption30Ref = useRef<HTMLButtonElement>(null);
  const hoursRef = useRef<HTMLButtonElement>(null);
  const hoursOptionLateRef = useRef<HTMLButtonElement>(null);

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
    const { sleep, clear } = createManagedSleep();

    const run = async () => {
      await sleep(1200);
      while (alive) {
        setStep(0);
        cOpacity.set(0);
        cScale.set(1);

        const p0 = getPos(thursdayRef.current);
        cx.set(p0.x + 24);
        cy.set(p0.y + 26);
        await sleep(250);
        if (!alive) break;

        await animate(cOpacity, 1, { duration: 0.22 });

        // Toggle a day off.
        await Promise.all([
          animate(cx, p0.x, { duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p0.y, { duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(1);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(420);
        if (!alive) break;

        // Open buffer dropdown.
        const p1 = getPos(bufferRef.current);
        await Promise.all([
          animate(cx, p1.x, { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p1.y, { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(2);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(260);
        if (!alive) break;

        // Select 30 min buffer from dropdown.
        const p2 = getPos(bufferOption30Ref.current);
        await Promise.all([
          animate(cx, p2.x, { duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p2.y, { duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(3);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(420);
        if (!alive) break;

        // Open working hours dropdown.
        const p3 = getPos(hoursRef.current);
        await Promise.all([
          animate(cx, p3.x, { duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p3.y, { duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(4);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(260);
        if (!alive) break;

        // Select 10:00 AM - 6:00 PM from dropdown.
        const p4 = getPos(hoursOptionLateRef.current);
        await Promise.all([
          animate(cx, p4.x, { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p4.y, { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(5);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(600);
        if (!alive) break;

        await animate(cOpacity, 0, { duration: 0.25 });
        await sleep(1200);
      }
    };

    run();
    return () => {
      alive = false;
      clear();
    };
  }, [cOpacity, cScale, cx, cy]);

  const bufferOpen = step === 2;
  const buffer = step >= 3 ? "30 min" : "15 min";
  const hoursOpen = step === 4;
  const hoursValue = step >= 5 ? "10:00 AM - 6:00 PM" : "9:00 AM - 6:00 PM";
  const dayOff = step >= 1;
  const lateStart = step >= 5;

  return (
    <div ref={containerRef} className="relative z-10 w-full max-w-xs mx-auto rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-cyan-500/10 overflow-visible" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-cyan-100">
            <Icon name="calendar2-week" className="text-cyan-700 text-[11px]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900">Custom availability</div>
            <div className="text-[11px] text-muted-foreground">Weekly schedule</div>
          </div>
        </div>
        <div className="relative">
          <motion.button
            ref={bufferRef}
            type="button"
            animate={bufferOpen ? { y: -1 } : { y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700 rounded-full bg-cyan-50 border border-cyan-200 px-2.5 py-0.5"
          >
            <span>Buffer {buffer}</span>
            <motion.span animate={bufferOpen ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.2 }}>
              <Icon name="chevron-right" className="text-[9px]" />
            </motion.span>
          </motion.button>

          <motion.div
            initial={false}
            animate={bufferOpen ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: -6, pointerEvents: "none" }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-1 z-20 w-28 rounded-xl border border-cyan-200 bg-white/95 p-1.5 shadow-lg shadow-cyan-500/10"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            {["15 min", "30 min", "45 min"].map((opt) => {
              const selected = opt === buffer;
              return (
                <button
                  key={opt}
                  ref={opt === "30 min" ? bufferOption30Ref : null}
                  type="button"
                  className={`w-full rounded-md px-2 py-1 text-left text-[11px] font-medium ${
                    selected ? "bg-cyan-50 text-cyan-700" : "text-gray-600"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
            const active = i < 5 && !(dayOff && i === 3);
            return (
              <div
                key={`${d}-${i}`}
                ref={i === 3 ? thursdayRef : null}
                className={`rounded-md border py-1 font-semibold ${active ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}
              >
                {d}
              </div>
            );
          })}
        </div>

        <div className="relative">
          <motion.button
            ref={hoursRef}
            type="button"
            animate={hoursOpen ? { y: -1 } : { y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 text-[11px] flex items-center justify-between"
          >
            <span className="text-muted-foreground">Working hours</span>
            <div className="flex items-center gap-1.5">
              <motion.span key={`hours-${hoursValue}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-semibold text-gray-800">
                {hoursValue}
              </motion.span>
              <motion.span animate={hoursOpen ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.2 }}>
                <Icon name="chevron-right" className="text-[9px] text-muted-foreground" />
              </motion.span>
            </div>
          </motion.button>

          <motion.div
            initial={false}
            animate={hoursOpen ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: -6, pointerEvents: "none" }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-gray-200 bg-white/95 p-1.5 shadow-lg shadow-cyan-500/10"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            {["9:00 AM - 6:00 PM", "10:00 AM - 6:00 PM", "11:00 AM - 7:00 PM"].map((opt) => {
              const selected = opt === hoursValue;
              return (
                <button
                  key={opt}
                  ref={opt === "10:00 AM - 6:00 PM" ? hoursOptionLateRef : null}
                  type="button"
                  className={`w-full rounded-md px-2 py-1 text-left text-[11px] font-medium ${
                    selected ? "bg-cyan-50 text-cyan-700" : "text-gray-600"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </motion.div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground">Preview slots</div>
          <div className="grid grid-cols-3 gap-1.5">
            {["9:00 AM", "10:30 AM", "2:00 PM"].map((slot, i) => {
              const disabled = (lateStart && i === 0) || (dayOff && i === 2);
              return (
                <motion.div
                  key={`${slot}-${disabled}`}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: disabled ? 0.45 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-lg border px-1.5 py-1 text-center text-[11px] font-medium ${disabled ? "border-gray-200 bg-gray-100 text-gray-400 line-through" : "border-cyan-200 bg-white text-gray-700"}`}
                >
                  {slot}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute top-0 left-0 z-50 drop-shadow-sm"
        style={{ x: cx, y: cy, scale: cScale, opacity: cOpacity, translateX: "-3px", translateY: "-2px" }}
      >
        <CursorSVG />
      </motion.div>
    </div>
  );
}

// ─── Mockup 6: Shareable link ────────────────────────────────────────────────
function ShareLinkMockup() {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);

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
    const { sleep, clear } = createManagedSleep();

    const run = async () => {
      await sleep(1200);
      while (alive) {
        setStep(0);
        cOpacity.set(0);
        cScale.set(1);

        const p0 = getPos(copyRef.current);
        cx.set(p0.x + 18);
        cy.set(p0.y + 22);
        await sleep(250);
        if (!alive) break;

        await animate(cOpacity, 1, { duration: 0.22 });

        // Copy link.
        await Promise.all([
          animate(cx, p0.x, { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p0.y, { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(1);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(380);
        if (!alive) break;

        // Share to WhatsApp.
        const p1 = getPos(whatsappRef.current);
        await Promise.all([
          animate(cx, p1.x, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }),
          animate(cy, p1.y, { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }),
        ]);
        await animate(cScale, 0.68, { duration: 0.08 });
        setStep(2);
        await animate(cScale, 1, { duration: 0.15 });
        await sleep(500);
        if (!alive) break;

        setStep(3);
        await sleep(680);
        if (!alive) break;

        await animate(cOpacity, 0, { duration: 0.25 });
        await sleep(1150);
      }
    };

    run();
    return () => {
      alive = false;
      clear();
    };
  }, [cOpacity, cScale, cx, cy]);

  const copied = step >= 1;
  const sent = step >= 2;
  const booked = step === 3;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs mx-auto space-y-2.5">
      <div className="rounded-2xl border border-white/70 bg-white/80 shadow-lg shadow-primary/10 overflow-hidden" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
            <Icon name="share" className="text-primary text-[11px]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900">Shareable booking link</div>
            <div className="text-[11px] text-muted-foreground">yourname.dinaya.lk</div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/[0.04] px-2.5 py-2">
            <Icon name="link-45deg" className="text-muted-foreground text-xs" />
            <span className="text-[11px] text-gray-700 flex-1 truncate">dilini.dinaya.lk</span>
            <motion.button
              ref={copyRef}
              type="button"
              animate={copied ? { scale: [1, 0.94, 1] } : { scale: 1 }}
              transition={{ duration: 0.22 }}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                copied ? "bg-primary text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: "whatsapp", label: "WhatsApp" },
              { icon: "instagram", label: "Instagram" },
              { icon: "facebook", label: "Facebook" },
            ].map((ch, i) => {
              const active = sent && i === 0;
              return (
                <motion.div
                  key={ch.label}
                  ref={i === 0 ? whatsappRef : null}
                  animate={active ? { y: -2, opacity: 1 } : { y: 0, opacity: sent ? 0.65 : 1 }}
                  transition={{ duration: 0.22 }}
                  className={`rounded-lg border px-1.5 py-1.5 text-center ${
                    active ? "border-primary/40 bg-primary/10" : "border-primary/15 bg-white"
                  }`}
                >
                  <Icon name={ch.icon} className={`text-[11px] mx-auto ${active ? "text-primary" : "text-gray-600"}`} />
                  <div className={`text-[10px] mt-0.5 ${active ? "text-primary font-medium" : "text-gray-600"}`}>{ch.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <motion.div
        animate={booked ? { opacity: 1, y: 0 } : { opacity: sent ? 0.8 : 0.4, y: booked ? 0 : 4 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-2 rounded-full border border-primary/15 bg-white/85 px-3 py-2 shadow-sm w-fit mx-auto"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10">
          <Icon name={booked ? "calendar-check" : sent ? "send" : "link-45deg"} className="text-[10px] text-primary" />
        </div>
        <span className="text-xs text-gray-700 font-medium">
          {booked ? "1 new booking from shared link" : sent ? "Shared to WhatsApp story" : "Ready to share"}
        </span>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute top-0 left-0 z-50 drop-shadow-sm"
        style={{ x: cx, y: cy, scale: cScale, opacity: cOpacity, translateX: "-3px", translateY: "-2px" }}
      >
        <CursorSVG />
      </motion.div>
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
  {
    num: "05", tag: "AVAILABILITY",
    headlinePre: "Dinaya", verb: { icon: "calendar2-week", label: "adapts" }, headlinePost: "to your real working hours.",
    desc: "Set business hours, block dates, and add buffer time. Only the slots you want are shown.",
    mockup: <AvailabilityMockup />,
    mockupBg: "bg-cyan-300/20",
  },
  {
    num: "06", tag: "SHARING",
    headlinePre: "Dinaya", verb: { icon: "share", label: "spreads" }, headlinePost: "your link across socials.",
    desc: "Copy once and share everywhere. Clients tap your link from WhatsApp, Instagram, or Facebook and book instantly.",
    mockup: <ShareLinkMockup />,
    mockupBg: "bg-blue-300/20",
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
          Six things that work together — so you stop chasing clients and start filling your calendar.
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
