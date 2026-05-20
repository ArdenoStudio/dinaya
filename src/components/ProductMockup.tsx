"use client";

import { useState } from "react";
import IPhoneMockup from "@/components/ui/iphone-mockup";

const mockDays = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

const mockups = [
  {
    business: "Dilini's Beauty Studio",
    location: "Colombo 3 · Open Mon–Sat, 9am–6pm",
    icon: "bi-scissors",
    url: "dilini.dinaya.lk",
    services: [
      { name: "Haircut & Style", duration: "45 min", price: "Rs. 2,500", selected: true },
      { name: "Facial Treatment", duration: "60 min", price: "Rs. 3,800", selected: false },
      { name: "Eyebrow Threading", duration: "20 min", price: "Rs. 800", selected: false },
    ],
    slots: ["9:00", "10:30", "11:00", "2:00", "3:30", "4:00"],
    selectedSlot: 2,
    notif: { title: "New booking!", detail: "Haircut · May 15, 11:00am", amount: "Rs. 2,500 paid" },
    payment: { title: "Payment received", detail: "Deposit:", amount: "Rs. 1,250" },
  },
  {
    business: "NF Wellness Clinic",
    location: "Kandy · Open Mon–Fri, 8am–5pm",
    icon: "bi-hospital",
    url: "nf-clinic.dinaya.lk",
    services: [
      { name: "General Consultation", duration: "30 min", price: "Rs. 1,500", selected: true },
      { name: "Dental Cleaning", duration: "45 min", price: "Rs. 3,500", selected: false },
      { name: "Follow-up Visit", duration: "20 min", price: "Rs. 800", selected: false },
    ],
    slots: ["8:30", "9:00", "10:00", "11:30", "2:00", "3:30"],
    selectedSlot: 2,
    notif: { title: "New appointment!", detail: "Consultation · May 15, 10:00am", amount: "Rs. 1,500 paid" },
    payment: { title: "Deposit received", detail: "Deposit:", amount: "Rs. 750" },
  },
  {
    business: "Priya's Tuition Centre",
    location: "Nugegoda · Open Mon–Sat, 2pm–8pm",
    icon: "bi-book-half",
    url: "priya-tuition.dinaya.lk",
    services: [
      { name: "Maths (O/L)", duration: "90 min", price: "Rs. 2,000", selected: true },
      { name: "Science (O/L)", duration: "90 min", price: "Rs. 2,000", selected: false },
      { name: "English (A/L)", duration: "60 min", price: "Rs. 1,500", selected: false },
    ],
    slots: ["2:00", "3:30", "5:00", "6:00", "6:30", "7:00"],
    selectedSlot: 0,
    notif: { title: "New enrolment!", detail: "Maths O/L · May 15, 2:00pm", amount: "Rs. 2,000 paid" },
    payment: { title: "Fee received", detail: "Monthly:", amount: "Rs. 4,000" },
  },
];

type Mockup = typeof mockups[0];

function PhoneScreen({ m }: { m: Mockup }) {
  const selectedService = m.services.find((s) => s.selected)!;
  const num = parseInt(selectedService.price.replace(/[^0-9]/g, ""));
  const depositAmount = `Rs. ${(num / 2).toLocaleString()}`;

  return (
    <div className="w-full h-full flex flex-col bg-[#f2f2f7]">

      {/* ── Gradient header: status bar + business identity + progress ── */}
      <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-600 px-[18px] pt-[66px] pb-[18px]">
        {/* Business row */}
        <div className="flex items-center gap-[12px] mb-[14px]">
          <div className="size-[42px] rounded-[13px] bg-white/20 flex items-center justify-center ring-1 ring-white/25 shrink-0">
            <i className={`bi ${m.icon} text-white text-[18px]`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[16px] leading-tight truncate">{m.business}</p>
            <p className="text-blue-200/80 text-[11px] truncate mt-[2px]">{m.url}</p>
          </div>
          <div className="flex items-center gap-[5px] bg-white/15 rounded-full px-[9px] py-[5px] shrink-0">
            <span className="size-[7px] rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-[11px] font-medium">Open</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-[7px]">
          {[
            { label: "Service", done: true },
            { label: "Time",    done: true },
            { label: "Confirm", done: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-[7px]">
              <div className={`flex items-center gap-[5px] rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${
                step.done
                  ? "bg-white/20 text-white/75"
                  : "bg-white text-blue-600 shadow-sm"
              }`}>
                {step.done
                  ? <i className="bi bi-check-lg text-[9px]" />
                  : <span className="size-[8px] rounded-full bg-blue-300 inline-block" />
                }
                {step.label}
              </div>
              {i < 2 && <div className="h-px w-[8px] bg-white/25 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 px-[14px] py-[12px] flex flex-col gap-[8px]">

        {/* Selected service */}
        <div className="bg-white rounded-[16px] px-[15px] py-[13px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-[9px]">Selected Service</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 leading-snug">{selectedService.name}</p>
              <div className="flex items-center gap-[4px] mt-[3px]">
                <i className="bi bi-clock text-gray-300 text-[10px]" />
                <p className="text-[11px] text-gray-400">{selectedService.duration}</p>
              </div>
            </div>
            <p className="text-[16px] font-bold text-blue-600 tabular-nums shrink-0">{selectedService.price}</p>
          </div>
        </div>

        {/* Appointment */}
        <div className="bg-white rounded-[16px] px-[15px] py-[13px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-[9px]">Appointment</p>
          <div className="flex items-center gap-[11px] mb-[9px]">
            <div className="size-[34px] rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
              <i className="bi bi-calendar3 text-blue-500 text-[13px]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Thursday, May 15</p>
              <p className="text-[11px] text-gray-400">2025</p>
            </div>
          </div>
          <div className="h-px bg-gray-100 mb-[9px]" />
          <div className="flex items-center gap-[11px]">
            <div className="size-[34px] rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
              <i className="bi bi-clock text-emerald-500 text-[13px]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-gray-900">{m.slots[m.selectedSlot]}</p>
              <p className="text-[11px] text-gray-400">{selectedService.duration}</p>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-[8px] py-[3px] rounded-full border border-emerald-100 shrink-0">
              Available
            </span>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-[16px] px-[15px] py-[13px]">
          <div className="flex justify-between items-center">
            <p className="text-[12px] text-gray-500">{selectedService.name}</p>
            <p className="text-[12px] text-gray-700 font-medium tabular-nums">{selectedService.price}</p>
          </div>
          <div className="flex justify-between items-center mt-[5px]">
            <p className="text-[11px] text-gray-400">Due now (50% deposit)</p>
            <p className="text-[11px] text-blue-600 font-semibold tabular-nums">{depositAmount}</p>
          </div>
          <div className="h-px bg-gray-100 my-[9px]" />
          <div className="flex justify-between items-center">
            <p className="text-[13px] font-bold text-gray-900">Total</p>
            <p className="text-[14px] font-bold text-gray-900 tabular-nums">{selectedService.price}</p>
          </div>
        </div>

      </div>

      {/* ── Pinned CTA ── */}
      <div className="px-[14px] pb-[26px] pt-[2px]">
        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-[17px] rounded-[14px] text-[16px] font-bold shadow-lg shadow-blue-500/25">
          Confirm & Pay — {selectedService.price}
        </button>
        <div className="flex items-center justify-center gap-[5px] mt-[9px]">
          <i className="bi bi-shield-check text-gray-300 text-[11px]" />
          <span className="text-[11px] text-gray-400">Secured by PayHere · SSL encrypted</span>
        </div>
      </div>

    </div>
  );
}

export default function ProductMockup() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  function goTo(index: number) {
    if (fading || index === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 180);
  }

  function navigate(dir: number) {
    goTo((current + dir + mockups.length) % mockups.length);
  }

  const m = mockups[current];

  const indicators = (
    <div className="flex justify-center gap-2 mt-8">
      {mockups.map((_, i) => (
        <button
          key={i}
          onClick={() => goTo(i)}
          aria-label={`Go to slide ${i + 1}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? "bg-blue-600 w-6" : "bg-gray-300 w-1.5 hover:bg-gray-400"
          }`}
        />
      ))}
    </div>
  );

  const navBtn = (dir: number, label: string, extraClass: string) => (
    <button
      onClick={() => navigate(dir)}
      aria-label={label}
      className={`z-20 size-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all ${extraClass}`}
    >
      <i className={`bi bi-chevron-${dir === -1 ? "left" : "right"} text-sm`} />
    </button>
  );

  return (
    <section className="max-w-5xl mx-auto px-6 pb-16 relative">
      {/* Atmospheric ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[480px] rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[220px] h-[220px] rounded-full bg-violet-500/[0.05] blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[180px] h-[180px] rounded-full bg-amber-500/[0.05] blur-3xl" />
      </div>

      {/* ── MOBILE: centred iPhone only ── */}
      {/* 15-pro native size: 393×852. At scale 0.72 → ~283×614. The wrapper
          collapses layout height so it matches the visual size; transformOrigin
          top-center keeps it horizontally centred. */}
      <div className="md:hidden flex flex-col items-center">
        <div
          className={`transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
          style={{ marginBottom: -Math.round(852 * (1 - 0.72)) }}
        >
          <IPhoneMockup
            model="15-pro"
            color="space-black"
            scale={0.72}
            screenBg="#f9f9f9"
            shadow
            safeArea={false}
            showHomeIndicator={false}
            innerShadow={false}
            style={{ transformOrigin: "top center" }}
          >
            <PhoneScreen m={m} />
          </IPhoneMockup>
        </div>
        {/* Nav row: prev · dots · next */}
        <div className="flex items-center gap-4 mt-6">
          {navBtn(-1, "Previous", "")}
          <div className="flex gap-2">
            {mockups.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-blue-600 w-6" : "bg-gray-300 w-1.5 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          {navBtn(1, "Next", "")}
        </div>
      </div>

      {/* ── DESKTOP: browser window + floating chips + iPhone corner ── */}
      <div className="hidden md:block">
        <div className="relative" style={{ perspective: "1200px" }}>
          {navBtn(-1, "Previous", "absolute -left-14 top-1/2 -translate-y-1/2")}
          {navBtn(1,  "Next",     "absolute -right-14 top-1/2 -translate-y-1/2")}

          <div className={`relative transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}>

            {/* Browser window */}
            <div
              className="rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(37,99,235,0.14),0_16px_40px_-8px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.05)]"
              style={{ transform: "rotateX(1.5deg)" }}
            >
              {/* Chrome bar */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-gray-100/95 to-gray-50 border-b border-gray-200/80">
                <div className="flex gap-1.5 shrink-0">
                  <div className="size-3 rounded-full bg-[#ff5f57]" />
                  <div className="size-3 rounded-full bg-[#febc2e]" />
                  <div className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 max-w-xs mx-auto bg-white rounded-md border border-gray-200/80 px-3 py-1.5 text-xs text-gray-400 font-mono text-center flex items-center justify-center gap-1.5">
                  <i className="bi bi-lock-fill text-blue-400 text-[9px]" />
                  {m.url}
                </div>
              </div>

              {/* Booking page */}
              <div className="bg-white p-6 sm:p-8">
                {/* Business header */}
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                    <i className={`bi ${m.icon} text-white text-xl`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.business}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{m.location}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-100/80">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    Available today
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Services */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Choose a service</p>
                    <div className="space-y-2">
                      {m.services.map((s) => (
                        <div
                          key={s.name}
                          className={`flex justify-between items-center p-3.5 rounded-xl cursor-pointer transition-all ${
                            s.selected
                              ? "border border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/60 shadow-sm"
                              : "border border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`size-4 rounded-full border-2 shrink-0 flex items-center justify-center ${s.selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                              {s.selected && <div className="size-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${s.selected ? "text-blue-900" : "text-gray-800"}`}>{s.name}</p>
                              <p className="text-xs text-gray-400">{s.duration}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold shrink-0 tabular-nums ${s.selected ? "text-blue-600" : "text-gray-600"}`}>{s.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar + time slots */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pick a date & time</p>
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 mb-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-800">May 2025</span>
                        <div className="flex gap-1">
                          <button className="size-7 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-gray-400 transition-all" aria-label="Previous month">
                            <i className="bi bi-chevron-left text-[10px]" />
                          </button>
                          <button className="size-7 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-gray-400 transition-all" aria-label="Next month">
                            <i className="bi bi-chevron-right text-[10px]" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 text-center gap-y-0.5">
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                          <div key={i} className="text-[9px] font-bold text-gray-400 pb-2 tracking-wider">{d}</div>
                        ))}
                        {mockDays.map((d, i) => (
                          <div
                            key={i}
                            className={`text-[11px] py-1 rounded-lg font-medium transition-all ${
                              d === 15
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
                                : d
                                ? "text-gray-600 hover:bg-white hover:shadow-sm cursor-pointer"
                                : ""
                            }`}
                          >
                            {d ?? ""}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {m.slots.map((t, i) => (
                        <button
                          key={t}
                          className={`text-xs py-2.5 rounded-xl font-semibold transition-all ${
                            i === m.selectedSlot
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                              : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm */}
                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25">
                    Confirm & Pay — {m.services.find((s) => s.selected)?.price}
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                    <i className="bi bi-shield-check text-blue-400" />
                    Secured by PayHere
                  </div>
                </div>

                {/* Dinaya branding footer */}
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    Powered by
                    <span className="inline-flex items-center gap-1 text-gray-900">
                      <svg width={13} height={13} viewBox="318 319 875 866" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
                        <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
                      </svg>
                      <span className="font-cal leading-none text-[11px]">Dinaya.lk</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating: new booking notification (top-right) */}
            <div className="absolute -top-5 -right-5 flex bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-2xl shadow-gray-900/12 p-3.5 items-center gap-3 max-w-[230px]">
              <div className="size-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <i className="bi bi-check-lg text-white text-sm" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{m.notif.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{m.notif.detail}</p>
                <p className="text-[11px] font-semibold text-amber-600">{m.notif.amount}</p>
              </div>
            </div>

            {/* Floating: payment notification (bottom-left) */}
            <div className="absolute -bottom-5 -left-5 flex bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-2xl shadow-gray-900/12 p-3.5 items-center gap-3 max-w-[210px]">
              <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                <i className="bi bi-credit-card text-white text-sm" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{m.payment.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {m.payment.detail} <span className="font-semibold text-blue-600">{m.payment.amount}</span>
                </p>
              </div>
            </div>

            {/* iPhone mockup — overlapping bottom-right */}
            <div
              className="absolute pointer-events-none overflow-hidden"
              style={{ right: 20, bottom: -40, zIndex: 20, width: 280, height: 400 }}
            >
              <IPhoneMockup
                model="15-pro"
                color="space-black"
                scale={0.67}
                screenBg="#f9f9f9"
                shadow={false}
                safeArea={false}
                showHomeIndicator={false}
                innerShadow={false}
              >
                <PhoneScreen m={m} />
              </IPhoneMockup>
            </div>
          </div>

          {indicators}
        </div>
      </div>
    </section>
  );
}
