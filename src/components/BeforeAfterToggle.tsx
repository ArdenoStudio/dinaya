"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

// Each pill scattered in its own direction — no pattern, like cards thrown on a table
const withoutItems = [
  { num: "01", label: "WhatsApp Messages, All Day",  icon: "chat-dots",          x: 2,  y: -6, rotate: 2.5  },
  { num: "02", label: "Double Bookings Happen",      icon: "exclamation-circle", x: 30, y: 4,  rotate: -5   },
  { num: "03", label: "Chase Clients For Payment",  icon: "currency-dollar",    x: 10, y: 2,  rotate: 3.5  },
  { num: "04", label: "One Angry Client Per Week",  icon: "emoji-frown",        x: 50, y: -2, rotate: -7.5 },
];

const withItems = [
  { num: "01", label: "Bookings While You Sleep",     icon: "calendar-check"  },
  { num: "02", label: "Zero Double Bookings, Ever",   icon: "check-circle"    },
  { num: "03", label: "Deposits Collected Upfront",   icon: "credit-card"     },
  { num: "04", label: "Reminders On Autopilot",       icon: "bell"            },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// "Without" pills — enter scattered, exit with blur
const withoutVariant: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(0px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  exit:   { opacity: 0, filter: "blur(10px)", scale: 0.97, transition: { duration: 0.22, ease: "easeIn" as const } },
};

// "With" pills — enter blurred from slightly below, unblur and snap into place
const withVariant: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
  exit:   { opacity: 0, filter: "blur(10px)", scale: 0.97, transition: { duration: 0.2, ease: "easeIn" as const } },
};

function WithoutPill({ item }: { item: typeof withoutItems[number] }) {
  return (
    <motion.div
      variants={withoutVariant}
      style={{
        translateX: item.x,
        translateY: item.y,
        rotate: item.rotate,
      }}
      className="flex items-center gap-2 origin-left"
    >
      {/* Pill — blue-grey scattered card look */}
      <div className="flex flex-1 items-center gap-3 rounded-full bg-[#c8d0e0] border border-[#b8c2d6] px-4 py-2.5 shadow-sm">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/50 border border-white/60 text-[11px] font-semibold text-slate-500">
          {item.num}
        </span>
        <span className="text-sm font-medium text-slate-600">{item.label}</span>
      </div>

      {/* Icon badge — floating detached */}
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#c8d0e0] border border-[#b8c2d6] shadow-sm">
        <Icon name={item.icon} className="text-xs text-slate-500" />
      </span>
    </motion.div>
  );
}

function WithPill({ item, i }: { item: typeof withItems[number]; i: number }) {
  return (
    <motion.div
      variants={withVariant}
      className="relative flex items-center gap-3 overflow-hidden rounded-full bg-primary px-4 py-2.5 shadow-md shadow-primary/20"
    >
      {/* Shine sweep */}
      <motion.span
        className="pointer-events-none absolute inset-0 -skew-x-12"
        initial={{ x: "-110%" }}
        animate={{ x: "220%" }}
        transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: "easeOut" }}
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)",
        }}
      />
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold text-white">
        {item.num}
      </span>
      <span className="flex-1 text-sm font-semibold text-white">{item.label}</span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon name={item.icon} className="text-xs text-white" />
      </span>
    </motion.div>
  );
}

export function BeforeAfterToggle() {
  const [active, setActive] = useState<"without" | "with">("without");

  useEffect(() => {
    const target = document.getElementById("feature-showcase");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive("with");
        else setActive("without");
      },
      { threshold: 0.15 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Toggle */}
      <div className="relative flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 p-1 shadow-sm">
        {(["without", "with"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="relative z-10 rounded-full px-5 py-1.5 text-sm font-medium transition-colors"
            style={{
              color: active === tab ? (tab === "with" ? "#fff" : "#111827") : "#6b7280",
            }}
          >
            {active === tab && (
              <motion.span
                layoutId="toggle-bg"
                className="absolute inset-0 rounded-full"
                style={{
                  background: tab === "with" ? "var(--color-primary, #2563eb)" : "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">
              {tab === "without" ? "Without Dinaya" : "With Dinaya"}
            </span>
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-[#edf0f5] overflow-hidden p-5 shadow-sm"
        style={{
          minHeight: "290px",
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* Horizontal stripe bands behind pills */}
        <AnimatePresence>
          {active === "without" && (
            <motion.div
              key="stripes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-2xl"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 h-11 bg-slate-400/[0.06]"
                  style={{ top: `${24 + i * 54}px` }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {active === "without" ? (
            <motion.div
              key="without"
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative space-y-3"
            >
              {withoutItems.map((item) => (
                <WithoutPill key={item.num} item={item} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="with"
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative space-y-3"
            >
              {withItems.map((item, i) => (
                <WithPill key={item.num} item={item} i={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
