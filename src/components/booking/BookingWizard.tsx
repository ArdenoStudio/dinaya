"use client";

import { useCallback, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Staff } from "@/db/schema";
import StepService from "./StepService";
import StepDateTime from "./StepDateTime";
import StepConfirm from "./StepConfirm";
import StaffPicker from "./StaffPicker";
import BookingDesktopSummary from "./BookingDesktopSummary";
import { getBookingCopy } from "@/lib/i18n";
import { getEligibleStaff, pickDefaultStaff } from "@/lib/booking-staff";
import { formatLkr } from "@/lib/utils";
import Link from "next/link";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  business: BookingBusiness;
  services: BookingService[];
  staff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  bookingUrlLabel: string;
  businessIcon?: string | null;
}

export type BookingBusiness = {
  id: string;
  bankTransferInstructions?: string | null;
  cancellationPolicy?: string | null;
  depositPolicy?: string | null;
  language?: string;
  lankaqrImageUrl?: string | null;
  name: string;
  payhereEnabled?: boolean;
  slug: string;
  logoUrl?: string | null;
};

export type BookingService = {
  id: string;
  afterBuffer: number;
  beforeBuffer: number;
  businessId: string;
  createdAt: Date;
  dailyCapacity: number | null;
  description: string | null;
  durationMinutes: number;
  isActive: boolean;
  minimumNoticeHours: number;
  name: string;
  priceLkr: number;
  requiresPayment: boolean;
  depositPercent: number;
};

export type BookingState = {
  service: BookingService | null;
  staff: Staff | null;
  date: string;
  timeSlot: string;
  timeSlotEnd: string;
  timeLabel: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
};

type SlotData = { startUtc: string; endUtc: string; label: string };

export default function BookingWizard({
  business,
  services,
  staff,
  staffServiceMap,
  bookingUrlLabel,
  businessIcon,
}: Props) {
  const copy = getBookingCopy(business.language);
  const progressSteps = [copy.service, copy.dateTime, copy.confirm];
  const todayStr = format(toZonedTime(new Date(), COLOMBO_TZ), "yyyy-MM-dd");

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BookingState>({
    service: null,
    staff: null,
    date: todayStr,
    timeSlot: "",
    timeSlotEnd: "",
    timeLabel: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    notes: "",
  });
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [confirmed, setConfirmed] = useState<{
    bookingId: string;
    manualPayment?: boolean;
    payhereFormData?: Record<string, string>;
    payhereUrl?: string;
    status?: string;
  } | null>(null);

  const needsStaffPicker = useMemo(() => {
    if (!state.service) return false;
    return getEligibleStaff(staff, staffServiceMap, state.service.id).length > 1;
  }, [state.service, staff, staffServiceMap]);

  function update(partial: Partial<BookingState>) {
    setState((s) => ({ ...s, ...partial }));
  }

  const selectService = useCallback(
    (service: BookingService) => {
      const defaultStaff = pickDefaultStaff(staff, staffServiceMap, service.id);
      update({
        service,
        staff: defaultStaff,
        date: todayStr,
        timeSlot: "",
        timeSlotEnd: "",
        timeLabel: "",
      });
      setSelectedSlot(null);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setStep(1);
      }
    },
    [staff, staffServiceMap, todayStr]
  );

  function selectSlot(slot: SlotData) {
    setSelectedSlot(slot);
    update({
      timeSlot: slot.startUtc,
      timeSlotEnd: slot.endUtc,
      timeLabel: slot.label,
    });
  }

  function goConfirm() {
    if (!state.service || !state.staff || !selectedSlot) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canProceedDesktop =
    Boolean(state.service && state.staff && selectedSlot) && step < 2;

  const depositPreview = state.service
    ? state.service.depositPercent > 0
      ? Math.ceil((state.service.priceLkr * state.service.depositPercent) / 100)
      : state.service.priceLkr
    : 0;

  const desktopPayCta =
    state.service?.requiresPayment && depositPreview > 0
      ? `${copy.confirmAndPay} — ${formatLkr(depositPreview)}`
      : copy.confirmAndPay;

  if (confirmed) {
    if (confirmed.payhereFormData && confirmed.payhereUrl) {
      return (
        <SuccessPanel
          icon="bi-credit-card"
          title="Redirecting to payment..."
          body="You'll be taken to PayHere to complete your booking."
        >
          <form id="payhere-form" method="POST" action={confirmed.payhereUrl}>
            {Object.entries(confirmed.payhereFormData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
            >
              Pay now
            </button>
          </form>
        </SuccessPanel>
      );
    }

    return (
      <SuccessPanel
        icon="bi-check-circle-fill"
        title={confirmed.manualPayment ? "Booking request received" : "Booking confirmed!"}
        body={
          confirmed.manualPayment
            ? "Your booking is pending until the business confirms your payment proof."
            : `We've sent a confirmation to ${state.clientEmail || state.clientPhone}.`
        }
        refId={confirmed.bookingId}
      />
    );
  }

  const desktopSelectionLine = [
    state.service?.name,
    state.date && state.timeLabel
      ? `${format(parseISO(state.date + "T12:00:00"), "d MMM")} · ${state.timeLabel}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="overflow-hidden md:rounded-2xl md:border md:border-gray-100/80 md:bg-white md:shadow-[0_24px_64px_-12px_rgba(37,99,235,0.12),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
      {/* Mobile gradient header + progress */}
      <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-600 px-[18px] pt-5 pb-[18px] md:hidden">
        <BusinessIdentity
          name={business.name}
          urlLabel={bookingUrlLabel}
          logoUrl={business.logoUrl}
          icon={businessIcon}
          openLabel={copy.openNow}
        />
        <ProgressPills steps={progressSteps} current={step} />
      </div>

      {/* Desktop step bar */}
      <div className="hidden border-b border-gray-100 bg-gray-50/50 px-8 py-6 md:block">
        <DesktopProgressBar steps={progressSteps} current={step} />
      </div>

      {/* Step 0–1: Service + DateTime */}
      {step < 2 && (
        <>
          <div className="md:px-8 md:py-7">
            <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8 lg:gap-10">
              <div className="border-b border-gray-100 p-[14px] md:flex md:flex-col md:border-0 md:p-0">
                <StepService
                  services={services}
                  selected={state.service}
                  copy={copy}
                  onSelect={selectService}
                />
                {state.service && needsStaffPicker && (
                  <StaffPicker
                    allStaff={staff}
                    staffServiceMap={staffServiceMap}
                    serviceId={state.service.id}
                    selected={state.staff}
                    copy={copy}
                    onSelect={(s) => {
                      update({ staff: s, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                      setSelectedSlot(null);
                    }}
                    compact
                  />
                )}
                {state.service && !state.staff && !needsStaffPicker && (
                  <p className="mt-3 text-center text-sm text-amber-600">{copy.noStaff}</p>
                )}
                <div className="hidden md:block">
                  <BookingDesktopSummary
                    copy={copy}
                    service={state.service}
                    staff={state.staff}
                    date={state.date}
                    timeLabel={state.timeLabel}
                  />
                </div>
              </div>

              <div className="bg-[#f2f2f7] p-[14px] md:flex md:flex-col md:rounded-2xl md:border md:border-gray-100 md:bg-gray-50/40 md:p-5">
                <StepDateTime
                  businessId={business.id}
                  copy={copy}
                  service={state.service}
                  staff={state.staff}
                  selectedDate={state.date}
                  selectedSlot={selectedSlot}
                  onDateChange={(date) => {
                    update({ date, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                    setSelectedSlot(null);
                  }}
                  onSlotSelect={selectSlot}
                  showContinue={step === 1}
                  onContinue={goConfirm}
                  onBack={() => setStep(0)}
                />
              </div>
            </div>
          </div>

          {/* Desktop bottom CTA */}
          <div className="hidden border-t border-gray-100 bg-gray-50/30 px-8 py-5 md:flex md:items-center md:gap-6">
            <div className="min-w-0 flex-1">
              {desktopSelectionLine ? (
                <p className="truncate text-sm font-medium text-gray-700">{desktopSelectionLine}</p>
              ) : (
                <p className="text-sm text-gray-400">{copy.selectServiceHint}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">{copy.securedByPayHere}</p>
            </div>
            <button
              type="button"
              onClick={goConfirm}
              disabled={!canProceedDesktop}
              className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-opacity hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {desktopPayCta}
            </button>
          </div>

          {/* Mobile: after slot on step 1, show continue via StepDateTime */}
        </>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <StepConfirm
          state={state}
          business={business}
          copy={copy}
          onUpdate={update}
          onBack={() => setStep(1)}
          onConfirmed={setConfirmed}
        />
      )}

      {/* Mobile footer branding (booking steps) */}
      {step < 2 && (
        <div className="flex items-center justify-center gap-1 pb-6 pt-2 text-[11px] text-gray-400 md:hidden">
          <span>{copy.poweredBy}</span>
          <Link href="https://dinaya.lk" className="inline-flex items-center gap-1 text-gray-500">
            <DinayaMark size={10} />
            <span className="font-cal text-[11px] leading-none">Dinaya.lk</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function DesktopProgressBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : done
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-400 ring-1 ring-gray-200"
                }`}
              >
                {done ? <i className="bi bi-check-lg text-xs" /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-sm font-semibold ${
                  active ? "text-gray-900" : done ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 min-w-[2rem] flex-1 rounded-full ${
                  done ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ProgressPills({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-[7px]">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-[7px]">
            <div
              className={`flex items-center gap-[5px] rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${
                active
                  ? "bg-white text-blue-600 shadow-sm"
                  : done
                  ? "bg-white/20 text-white/75"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {done ? (
                <i className="bi bi-check-lg text-[9px]" />
              ) : (
                <span
                  className={`inline-block size-[8px] rounded-full ${active ? "bg-blue-300" : "bg-white/30"}`}
                />
              )}
              {label}
            </div>
            {i < steps.length - 1 && <div className="h-px w-[8px] shrink-0 bg-white/25" />}
          </div>
        );
      })}
    </div>
  );
}

function BusinessIdentity({
  name,
  urlLabel,
  logoUrl,
  icon,
  openLabel,
}: {
  name: string;
  urlLabel: string;
  logoUrl?: string | null;
  icon?: string | null;
  openLabel: string;
}) {
  return (
    <div className="mb-[14px] flex items-center gap-[12px]">
      <BusinessAvatar name={name} logoUrl={logoUrl} icon={icon} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold leading-tight text-white">{name}</p>
        <p className="mt-[2px] truncate text-[11px] text-blue-200/80">{urlLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-[5px] rounded-full bg-white/15 px-[9px] py-[5px]">
        <span className="size-[7px] animate-pulse rounded-full bg-emerald-400" />
        <span className="text-[11px] font-medium text-white">{openLabel}</span>
      </div>
    </div>
  );
}

function BusinessAvatar({
  name,
  logoUrl,
  icon,
  size,
}: {
  name: string;
  logoUrl?: string | null;
  icon?: string | null;
  size: "md" | "lg";
}) {
  const dim = size === "lg" ? "size-12 rounded-xl" : "size-[42px] rounded-[13px]";
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={`${dim} shrink-0 object-cover ring-1 ring-white/25`} />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25`}
    >
      {icon ? (
        <i className={`bi ${icon} text-white ${size === "lg" ? "text-xl" : "text-[18px]"}`} />
      ) : (
        <span className={`font-bold text-white ${size === "lg" ? "text-xl" : "text-lg"}`}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function DinayaMark({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="318 319 875 866"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
    </svg>
  );
}

function SuccessPanel({
  icon,
  title,
  body,
  refId,
  children,
}: {
  icon: string;
  title: string;
  body: string;
  refId?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center md:border md:border-gray-100 md:shadow-sm">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blue-50">
        <i className={`bi ${icon} text-2xl text-blue-600`} />
      </div>
      <h2 className="mb-2 font-cal text-xl">{title}</h2>
      <p className="mb-6 text-pretty text-sm text-gray-500">{body}</p>
      {refId && (
        <p className="mb-4 text-xs text-gray-400">
          Ref: {refId.slice(0, 8).toUpperCase()}
        </p>
      )}
      {children}
    </div>
  );
}
