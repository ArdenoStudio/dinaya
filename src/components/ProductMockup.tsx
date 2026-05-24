"use client";

import { useState, type ReactNode } from "react";
import IPhoneMockup from "@/components/ui/iphone-mockup";
import { Icon } from "@/components/ui/Icon";

type DayCell = { day: number | null; status?: "available" | "booked" | "selected" };

type Slot = { label: string; badge?: string };

type PersonaData = {
  business: string;
  location: string;
  icon: string;
  url: string;
  clientName: string;
  services: { name: string; duration: string; price: string; selected: boolean }[];
  slots: Slot[];
  selectedSlot: number;
  trust: { rating: number; bookings: number };
  notif: { title: string; detail: string; amount: string };
  payment: { title: string; detail: string; amount: string };
  confirmationMessage: string;
};

const primaryPersona: PersonaData = {
  business: "Dilini's Beauty Studio",
  location: "Colombo 3 · Open Mon–Sat, 9am–6pm",
  icon: "scissors",
  url: "dilini.dinaya.lk",
  clientName: "Samadhi",
  services: [
    { name: "Haircut & Style", duration: "45 min", price: "Rs. 2,500", selected: true },
    { name: "Facial Treatment", duration: "60 min", price: "Rs. 3,800", selected: false },
    { name: "Eyebrow Threading", duration: "20 min", price: "Rs. 800", selected: false },
  ],
  slots: [
    { label: "9:00 AM" },
    { label: "10:30 AM" },
    { label: "11:00 AM" },
    { label: "2:00 PM" },
    { label: "3:30 PM" },
    { label: "4:00 PM", badge: "Last slot!" },
  ],
  selectedSlot: 2,
  trust: { rating: 4.9, bookings: 240 },
  notif: { title: "New booking!", detail: "Haircut · May 15, 11:00 AM", amount: "Rs. 2,500 paid" },
  payment: { title: "Payment received", detail: "Deposit:", amount: "Rs. 1,250" },
  confirmationMessage:
    "Hi Samadhi, your Haircut & Style at Dilini's Beauty Studio is confirmed for Thu, May 15 at 11:00 AM.",
};

const mockDays: DayCell[] = [
  { day: null }, { day: null }, { day: null },
  { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 },
  { day: 5, status: "booked" }, { day: 6, status: "booked" },
  { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 },
  { day: 12, status: "available" }, { day: 13, status: "available" }, { day: 14, status: "available" },
  { day: 15, status: "selected" },
  { day: 16 }, { day: 17 }, { day: 18 },
  { day: 19, status: "available" }, { day: 20, status: "available" }, { day: 21, status: "available" },
  { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 },
];

const slides = [
  { type: "customer" as const, label: "Book", ariaLabel: "Customer booking view" },
  { type: "owner" as const, label: "Manage", ariaLabel: "Owner dashboard view" },
  { type: "confirmation" as const, label: "Confirm", ariaLabel: "Booking confirmation message" },
];

const industries = [
  { icon: "scissors", label: "Salons" },
  { icon: "hospital", label: "Clinics" },
  { icon: "book-half", label: "Tuition" },
  { icon: "heart-pulse", label: "Wellness" },
];

function DinayaLogo({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="318 319 875 866" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
      <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
    </svg>
  );
}

function DinayaBranding({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full ${compact ? "px-2.5 py-1" : "px-3 py-1.5"}`}>
      <span className={`text-gray-500 ${compact ? "text-[11px]" : "text-xs"}`}>Powered by</span>
      <span className="inline-flex items-center gap-1 text-gray-900">
        <DinayaLogo size={compact ? 11 : 15} />
        <span className={`font-cal leading-none text-gray-900 ${compact ? "text-[11px]" : "text-xs"}`}>Dinaya.lk</span>
      </span>
    </div>
  );
}

function TrustLine({ persona, light = false }: { persona: PersonaData; light?: boolean }) {
  return (
    <p className={`text-xs mt-0.5 ${light ? "text-blue-200/90" : "text-gray-500"}`}>
      {persona.trust.rating} ★ · {persona.trust.bookings} bookings
    </p>
  );
}

function CalendarDay({ cell }: { cell: DayCell }) {
  const d = cell.day;
  if (!d) return <div />;

  const isSelected = cell.status === "selected";
  const isBooked = cell.status === "booked";
  const isAvailable = cell.status === "available";

  return (
    <div
      className={`relative flex flex-col items-center justify-center text-[11px] py-1 rounded-lg font-medium transition-all min-h-[28px] ${
        isSelected
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
          : isBooked
          ? "text-gray-300 line-through cursor-not-allowed"
          : d
          ? "text-gray-600 hover:bg-white hover:shadow-sm cursor-pointer"
          : ""
      }`}
    >
      {d}
      {isAvailable && !isSelected && (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-emerald-500" />
      )}
    </div>
  );
}

function FloatingToasts({ persona }: { persona: PersonaData }) {
  return (
    <>
      <div className="absolute -top-5 -right-5 flex bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-2xl shadow-gray-900/12 p-3.5 items-center gap-3 max-w-[230px]">
        <div className="size-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
          <Icon name="check-lg" className="text-white text-sm" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{persona.notif.title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{persona.notif.detail}</p>
          <p className="text-[11px] font-semibold text-amber-600">{persona.notif.amount}</p>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-5 flex bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-2xl shadow-gray-900/12 p-3.5 items-center gap-3 max-w-[210px]">
        <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
          <Icon name="credit-card" className="text-white text-sm" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{persona.payment.title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {persona.payment.detail}{" "}
            <span className="font-semibold text-blue-600">{persona.payment.amount}</span>
          </p>
        </div>
      </div>
    </>
  );
}

function PhoneScreen({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;
  const num = parseInt(selectedService.price.replace(/[^0-9]/g, ""));
  const depositAmount = `Rs. ${(num / 2).toLocaleString()}`;
  const selectedTime = persona.slots[persona.selectedSlot].label;

  return (
    <div className="w-full h-full flex flex-col bg-[#f2f2f7]">
      <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-600 px-[18px] pt-[66px] pb-[18px]">
        <div className="flex items-center gap-[12px] mb-[14px]">
          <div className="size-[42px] rounded-[13px] bg-white/20 flex items-center justify-center ring-1 ring-white/25 shrink-0">
            <Icon name={persona.icon} className="text-white text-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[16px] leading-tight truncate">{persona.business}</p>
            <TrustLine persona={persona} light />
          </div>
          <div className="flex items-center gap-[5px] bg-white/15 rounded-full px-[9px] py-[5px] shrink-0">
            <span className="size-[7px] rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-[11px] font-medium">Open</span>
          </div>
        </div>

        <div className="flex items-center gap-[7px]">
          {[
            { label: "Service", done: true },
            { label: "Time", done: true },
            { label: "Confirm", done: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-[7px]">
              <div
                className={`flex items-center gap-[5px] rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${
                  step.done ? "bg-white/20 text-white/75" : "bg-white text-blue-600 shadow-sm"
                }`}
              >
                {step.done ? (
                  <Icon name="check-lg" className="text-[9px]" />
                ) : (
                  <span className="size-[8px] rounded-full bg-blue-300 inline-block" />
                )}
                {step.label}
              </div>
              {i < 2 && <div className="h-px w-[8px] bg-white/25 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-[14px] py-[12px] flex flex-col gap-[8px]">
        <div className="bg-white rounded-[16px] px-[15px] py-[13px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-[9px]">Selected Service</p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 leading-snug">{selectedService.name}</p>
              <div className="flex items-center gap-[4px] mt-[3px]">
                <Icon name="clock" className="text-gray-300 text-[10px]" />
                <p className="text-[11px] text-gray-400">{selectedService.duration}</p>
              </div>
            </div>
            <p className="text-[16px] font-bold text-blue-600 tabular-nums shrink-0">{selectedService.price}</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] px-[15px] py-[13px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-[9px]">Appointment</p>
          <div className="flex items-center gap-[11px] mb-[9px]">
            <div className="size-[34px] rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
              <Icon name="calendar3" className="text-blue-500 text-[13px]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Thursday, May 15</p>
              <p className="text-[11px] text-gray-400">2025</p>
            </div>
          </div>
          <div className="h-px bg-gray-100 mb-[9px]" />
          <div className="flex items-center gap-[11px]">
            <div className="size-[34px] rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
              <Icon name="clock" className="text-emerald-500 text-[13px]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-gray-900">{selectedTime}</p>
              <p className="text-[11px] text-gray-400">{selectedService.duration}</p>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-[8px] py-[3px] rounded-full border border-emerald-100 shrink-0">
              Available
            </span>
          </div>
        </div>

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

      <div className="px-[14px] pb-[26px] pt-[2px]">
        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-[17px] rounded-[14px] text-[16px] font-bold shadow-lg shadow-blue-500/25">
          Confirm & Pay — {selectedService.price}
        </button>
        <div className="flex items-center justify-center gap-[5px] mt-[9px]">
          <Icon name="shield-check" className="text-gray-300 text-[11px]" />
          <span className="text-[11px] text-gray-400">Secured by PayHere · SSL encrypted</span>
        </div>
        <div className="flex justify-center mt-[8px]">
          <DinayaBranding compact />
        </div>
      </div>
    </div>
  );
}

function ConfirmationPhoneScreen({ persona }: { persona: PersonaData }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#e5ddd5]">
      <div className="bg-[#075e54] px-[16px] pt-[66px] pb-[12px]">
        <div className="flex items-center gap-[10px]">
          <div className="size-[36px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Icon name={persona.icon} className="text-white text-[16px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[15px] truncate">{persona.business}</p>
            <p className="text-[#a7d4c8] text-[11px]">Business account</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-[12px] py-[16px] flex flex-col justify-end gap-[8px]">
        <div className="self-start max-w-[88%] bg-white rounded-[12px] rounded-tl-[2px] px-[12px] py-[10px] shadow-sm">
          <p className="text-[13px] text-gray-800 leading-snug">{persona.confirmationMessage}</p>
          <div className="flex items-center justify-end gap-[4px] mt-[4px]">
            <span className="text-[10px] text-gray-400">11:02 AM</span>
            <Icon name="check-lg" className="text-blue-400 text-[10px]" />
          </div>
        </div>
        <div className="self-start flex items-center gap-[6px] bg-white/80 rounded-full px-[10px] py-[5px]">
          <Icon name="check-circle-fill" className="text-emerald-500 text-[12px]" />
          <span className="text-[11px] text-gray-600 font-medium">Booking confirmed</span>
        </div>
      </div>

      <div className="px-[14px] pb-[26px] pt-[8px] bg-[#f0f0f0]">
        <p className="text-center text-[11px] text-gray-500 mb-[8px]">
          Automated WhatsApp &amp; email — no manual follow-up
        </p>
        <div className="flex justify-center">
          <DinayaBranding compact />
        </div>
      </div>
    </div>
  );
}

function OwnerDashboardPhoneScreen({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b px-[16px] pt-[66px] pb-[14px]">
        <p className="font-cal text-[15px] font-semibold text-gray-900">Dinaya</p>
        <p className="text-[12px] text-gray-500 mt-[2px]">Today&apos;s schedule</p>
      </div>

      <div className="flex-1 px-[14px] py-[12px] flex flex-col gap-[8px]">
        <div className="grid grid-cols-2 gap-[8px]">
          <div className="bg-white rounded-[12px] px-[12px] py-[10px] border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Revenue</p>
            <p className="text-[15px] font-bold text-gray-900 mt-[2px]">Rs. 2,500</p>
          </div>
          <div className="bg-white rounded-[12px] px-[12px] py-[10px] border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bookings</p>
            <p className="text-[15px] font-bold text-gray-900 mt-[2px]">3 today</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] px-[14px] py-[12px] border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-[8px]">Up next</p>
          <div className="flex items-center gap-[10px]">
            <div className="size-[36px] rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-[13px] font-bold text-blue-600">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{persona.clientName} Perera</p>
              <p className="text-[11px] text-gray-500">{selectedService.name} · 11:00 AM</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-[7px] py-[3px] rounded-full shrink-0">
              Paid
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-[14px] px-[12px] py-[10px] flex items-center gap-[10px]">
          <div className="size-[32px] bg-amber-400 rounded-full flex items-center justify-center shrink-0">
            <Icon name="check-lg" className="text-white text-[12px]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-gray-900">{persona.notif.title}</p>
            <p className="text-[11px] text-gray-600">{persona.notif.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerBookingDesktop({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected);

  return (
    <div className="bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
          <Icon name={persona.icon} className="text-white text-xl" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{persona.business}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{persona.location}</p>
          <TrustLine persona={persona} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-100/80">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          Available today
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Choose a service</p>
          <div className="space-y-2">
            {persona.services.map((s) => (
              <div
                key={s.name}
                className={`flex justify-between items-center p-3.5 rounded-xl cursor-pointer transition-all ${
                  s.selected
                    ? "border border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/60 shadow-sm"
                    : "border border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      s.selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {s.selected && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${s.selected ? "text-blue-900" : "text-gray-800"}`}>{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 tabular-nums ${s.selected ? "text-blue-600" : "text-gray-600"}`}>
                  {s.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pick a date &amp; time</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 mb-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-800">May 2025</span>
              <div className="flex gap-1">
                <button className="size-7 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-gray-400 transition-all" aria-label="Previous month">
                  <Icon name="chevron-left" className="text-[10px]" />
                </button>
                <button className="size-7 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-gray-400 transition-all" aria-label="Next month">
                  <Icon name="chevron-right" className="text-[10px]" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center gap-y-0.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-[9px] font-bold text-gray-400 pb-2 tracking-wider">
                  {d}
                </div>
              ))}
              {mockDays.map((cell, i) => (
                <CalendarDay key={i} cell={cell} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {persona.slots.map((slot, i) => (
              <button
                key={slot.label}
                className={`relative flex flex-col items-center justify-center text-xs py-2 rounded-xl font-semibold transition-all min-h-[44px] ${
                  i === persona.selectedSlot
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white"
                }`}
              >
                {slot.label}
                {slot.badge && (
                  <span
                    className={`text-[9px] font-bold mt-0.5 ${
                      i === persona.selectedSlot ? "text-blue-100" : "text-amber-600"
                    }`}
                  >
                    {slot.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
        <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25">
          Confirm & Pay — {selectedService?.price}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <Icon name="shield-check" className="text-blue-400" />
          Secured by PayHere
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <DinayaBranding />
      </div>
    </div>
  );
}

function OwnerDashboardDesktop({ persona }: { persona: PersonaData }) {
  const selectedService = persona.services.find((s) => s.selected)!;

  const todayBookings = [
    { time: "9:00 AM", client: "Nimali W.", service: "Facial Treatment", status: "Completed", amount: "Rs. 3,800" },
    { time: "11:00 AM", client: `${persona.clientName} P.`, service: selectedService.name, status: "Confirmed", amount: selectedService.price },
    { time: "2:00 PM", client: "Kavindi R.", service: "Eyebrow Threading", status: "Pending", amount: "Rs. 800" },
  ];

  return (
    <div className="bg-gray-50 p-6 sm:p-8 min-h-[420px]">
      <div className="flex gap-4">
        <aside className="hidden sm:flex w-[28%] shrink-0 flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="border-b px-3 py-2.5">
            <p className="font-cal text-sm font-semibold text-gray-900">Dinaya</p>
            <p className="text-[10px] text-gray-400 truncate">{persona.business}</p>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-0.5">
            {["Overview", "Bookings", "Clients", "Payments", "Settings"].map((item) => (
              <div
                key={item}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${
                  item === "Bookings" ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-600"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Today&apos;s schedule</h3>
              <p className="text-xs text-gray-400 mt-0.5">Thursday, May 15, 2025</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1">
                Rs. 7,100 today
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                3 bookings
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-0 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 border-b bg-gray-50/80">
              <span>Time</span>
              <span>Client</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {todayBookings.map((b) => (
              <div
                key={b.time}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center px-4 py-3 border-b last:border-b-0 text-sm hover:bg-gray-50/50"
              >
                <span className="text-xs font-medium text-gray-500 tabular-nums w-16">{b.time}</span>
                <div>
                  <p className="font-medium text-gray-900">{b.client}</p>
                  <p className="text-xs text-gray-400">{b.service}</p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    b.status === "Confirmed"
                      ? "bg-emerald-50 text-emerald-700"
                      : b.status === "Completed"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {b.status}
                </span>
                <span className="text-xs font-semibold text-gray-700 tabular-nums text-right">{b.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationDesktop({ persona }: { persona: PersonaData }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-10 min-h-[420px] flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="size-10 rounded-full bg-[#25D366] flex items-center justify-center">
            <Icon name="whatsapp" className="text-white text-lg" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{persona.business}</p>
            <p className="text-xs text-gray-400">WhatsApp Business</p>
          </div>
          <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
            Sent automatically
          </span>
        </div>

        <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-inner">
          <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 max-w-[90%] shadow-sm">
            <p className="text-sm text-gray-800 leading-relaxed">{persona.confirmationMessage}</p>
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[10px] text-gray-400">11:02 AM</span>
              <Icon name="check-lg" className="text-blue-400 text-[11px]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Icon name="envelope" className="text-gray-400" />
          <span>Email confirmation sent to {persona.clientName.toLowerCase()}@email.com</span>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Automated WhatsApp &amp; email — no manual follow-up
        </p>
      </div>
    </div>
  );
}

function BrowserChrome({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(37,99,235,0.14),0_16px_40px_-8px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.05)]"
      style={{ transform: "rotateX(1.5deg)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-gray-100/95 to-gray-50 border-b border-gray-200/80">
        <div className="flex gap-1.5 shrink-0">
          <div className="size-3 rounded-full bg-[#ff5f57]" />
          <div className="size-3 rounded-full bg-[#febc2e]" />
          <div className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 max-w-xs mx-auto bg-white rounded-md border border-gray-200/80 px-3 py-1.5 text-xs text-gray-400 font-mono text-center flex items-center justify-center gap-1.5">
          <Icon name="lock-fill" className="text-blue-400 text-[9px]" />
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

function AlsoWorksFor() {
  return (
    <div className="mt-6 text-center">
      <p className="text-xs text-gray-400 mb-2">Also works for</p>
      <div className="flex flex-wrap justify-center gap-3">
        {industries.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm"
          >
            <Icon name={item.icon} className="text-blue-500 text-sm" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideIndicators({
  current,
  onGoTo,
}: {
  current: number;
  onGoTo: (index: number) => void;
}) {
  return (
    <div className="mt-8">
      <div className="flex justify-center gap-4 mb-3">
        {slides.map((slide, i) => (
          <button
            key={slide.type}
            onClick={() => onGoTo(i)}
            className={`text-xs font-medium transition-colors ${
              i === current ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {slide.label}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.type}
            onClick={() => onGoTo(i)}
            aria-label={slide.ariaLabel}
            aria-current={i === current ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-blue-600 w-6" : "bg-gray-300 w-1.5 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
      <AlsoWorksFor />
    </div>
  );
}

function renderMobileScreen(slideType: (typeof slides)[number]["type"], persona: PersonaData) {
  switch (slideType) {
    case "customer":
      return <PhoneScreen persona={persona} />;
    case "owner":
      return <OwnerDashboardPhoneScreen persona={persona} />;
    case "confirmation":
      return <ConfirmationPhoneScreen persona={persona} />;
  }
}

function renderDesktopContent(slideType: (typeof slides)[number]["type"], persona: PersonaData) {
  switch (slideType) {
    case "customer":
      return <CustomerBookingDesktop persona={persona} />;
    case "owner":
      return <OwnerDashboardDesktop persona={persona} />;
    case "confirmation":
      return <ConfirmationDesktop persona={persona} />;
  }
}

export default function ProductMockup() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const persona = primaryPersona;
  const slide = slides[current];

  function goTo(index: number) {
    if (fading || index === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 180);
  }

  function navigate(dir: number) {
    goTo((current + dir + slides.length) % slides.length);
  }

  const navBtn = (dir: number, label: string, extraClass: string) => (
    <button
      onClick={() => navigate(dir)}
      aria-label={label}
      className={`z-20 size-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all ${extraClass}`}
    >
      <Icon name={`chevron-${dir === -1 ? "left" : "right"}`} className="text-sm" />
    </button>
  );

  const browserUrl =
    slide.type === "owner" ? "dashboard.dinaya.lk" : slide.type === "confirmation" ? "messages" : persona.url;

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-16 pb-16 relative overflow-visible">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[480px] rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[220px] h-[220px] rounded-full bg-violet-500/[0.05] blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[180px] h-[180px] rounded-full bg-amber-500/[0.05] blur-3xl" />
      </div>

      {/* Mobile */}
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
            {renderMobileScreen(slide.type, persona)}
          </IPhoneMockup>
        </div>
        <div className="flex items-center gap-4 mt-6">
          {navBtn(-1, "Previous", "")}
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.type}
                onClick={() => goTo(i)}
                aria-label={s.ariaLabel}
                aria-current={i === current ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "bg-blue-600 w-6" : "bg-gray-300 w-1.5 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          {navBtn(1, "Next", "")}
        </div>
        <AlsoWorksFor />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center gap-3 lg:gap-5">
          {navBtn(-1, "Previous", "shrink-0")}

          <div className="relative flex-1 min-w-0" style={{ perspective: "1200px" }}>
            <div className={`relative transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}>
              <BrowserChrome url={browserUrl}>{renderDesktopContent(slide.type, persona)}</BrowserChrome>

              {slide.type === "owner" && <FloatingToasts persona={persona} />}

              {slide.type === "customer" && (
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
                    <PhoneScreen persona={persona} />
                  </IPhoneMockup>
                </div>
              )}
            </div>
          </div>

          {navBtn(1, "Next", "shrink-0")}
        </div>

        <SlideIndicators current={current} onGoTo={goTo} />
      </div>
    </section>
  );
}
