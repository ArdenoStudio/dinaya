import { addDays, differenceInMinutes, format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const SLOT_INTERVAL_MINUTES = 15;
const LOOKBACK_DAYS = 84;
const MIN_HISTORY_BOOKINGS = 4;
const BUSY_CURRENT_UTILIZATION = 0.7;
const BUSY_HISTORICAL_FILL_RATE = 0.6;

export type DemandConfidence = "low" | "medium" | "high";
export type DemandSource = "dinaya_bookings" | "google_calendar" | "google_places";

export type DemandSourceStatus = {
  source: DemandSource;
  status: "used" | "not_connected" | "not_configured" | "unavailable";
  label: string;
  busyWindowCount?: number;
};

export type DemandBooking = {
  startsAt: Date | string;
  endsAt: Date | string;
  status: string;
  googleCalendarEventId?: string | null;
  source?: DemandSource;
};

export type DemandAssessment = {
  shouldSuggest: boolean;
  demandLabel: "quiet" | "normal" | "busy";
  quietScore: number;
  confidence: DemandConfidence;
  currentUtilizationRate: number;
  currentBookingCount: number;
  availableSlotCount: number;
  historicalBookingCount: number;
  historicalSameWindowBookedDays: number | null;
  historicalSameWindowSampleDays: number | null;
  historicalSameWindowFillRate: number | null;
  reason: string;
  sources: DemandSourceStatus[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isActiveDemandBooking(status: string): boolean {
  return status !== "cancelled";
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB;
}

function localDateKey(value: Date, timezone: string): string {
  return format(toZonedTime(value, timezone), "yyyy-MM-dd");
}

function localMinutes(value: Date, timezone: string): number {
  const local = toZonedTime(value, timezone);
  return local.getHours() * 60 + local.getMinutes();
}

function localWeekdaySampleKeys(targetStart: Date, timezone: string): Set<string> {
  const targetLocal = toZonedTime(targetStart, timezone);
  const sampleKeys = new Set<string>();

  for (let daysBack = 7; daysBack <= LOOKBACK_DAYS; daysBack += 7) {
    sampleKeys.add(format(subDays(targetLocal, daysBack), "yyyy-MM-dd"));
  }

  return sampleKeys;
}

function bookingOverlapsLocalWindow(
  booking: DemandBooking,
  targetStartMinutes: number,
  targetEndMinutes: number,
  timezone: string,
): boolean {
  const bookingStart = localMinutes(asDate(booking.startsAt), timezone);
  const bookingEnd = localMinutes(asDate(booking.endsAt), timezone);
  return bookingStart < targetEndMinutes && bookingEnd > targetStartMinutes;
}

function countGoogleCalendarWindows(bookings: DemandBooking[]): number {
  return bookings.filter((booking) => (
    booking.source === "google_calendar" || Boolean(booking.googleCalendarEventId)
  )).length;
}

export function assessDemandForGap(input: {
  targetWindowStart: Date;
  targetWindowEnd: Date;
  gapMinutes: number;
  availableSlotCount: number;
  currentBookings: DemandBooking[];
  historicalBookings: DemandBooking[];
  timezone: string;
  sourceStatuses?: DemandSourceStatus[];
}): DemandAssessment {
  const activeCurrentBookings = input.currentBookings.filter((booking) => isActiveDemandBooking(booking.status));
  const activeHistoricalBookings = input.historicalBookings.filter((booking) => isActiveDemandBooking(booking.status));
  const bookedMinutes = activeCurrentBookings.reduce((total, booking) => {
    const startsAt = asDate(booking.startsAt);
    const endsAt = asDate(booking.endsAt);
    if (!rangesOverlap(startsAt, endsAt, addDays(input.targetWindowStart, -1), addDays(input.targetWindowStart, 1))) {
      return total;
    }
    return total + Math.max(0, differenceInMinutes(endsAt, startsAt));
  }, 0);
  const availableMinutes = input.availableSlotCount * SLOT_INTERVAL_MINUTES;
  const currentUtilizationRate = bookedMinutes + availableMinutes > 0
    ? bookedMinutes / (bookedMinutes + availableMinutes)
    : 0;

  const sampleKeys = localWeekdaySampleKeys(input.targetWindowStart, input.timezone);
  const targetStartMinutes = localMinutes(input.targetWindowStart, input.timezone);
  const targetEndMinutes = localMinutes(input.targetWindowEnd, input.timezone);
  const bookedSampleKeys = new Set<string>();

  for (const booking of activeHistoricalBookings) {
    const key = localDateKey(asDate(booking.startsAt), input.timezone);
    if (!sampleKeys.has(key)) continue;
    if (bookingOverlapsLocalWindow(booking, targetStartMinutes, targetEndMinutes, input.timezone)) {
      bookedSampleKeys.add(key);
    }
  }

  const hasEnoughHistory = activeHistoricalBookings.length >= MIN_HISTORY_BOOKINGS;
  const historicalSameWindowSampleDays = hasEnoughHistory ? sampleKeys.size : null;
  const historicalSameWindowBookedDays = hasEnoughHistory ? bookedSampleKeys.size : null;
  const historicalSameWindowFillRate = hasEnoughHistory && sampleKeys.size > 0
    ? bookedSampleKeys.size / sampleKeys.size
    : null;

  let quietScore = 45;
  if (input.gapMinutes >= 180) quietScore += 25;
  else if (input.gapMinutes >= 120) quietScore += 18;
  else if (input.gapMinutes >= 90) quietScore += 10;
  else quietScore += 4;

  if (currentUtilizationRate <= 0.25) quietScore += 25;
  else if (currentUtilizationRate <= 0.45) quietScore += 14;
  else if (currentUtilizationRate <= 0.6) quietScore += 6;
  else if (currentUtilizationRate >= BUSY_CURRENT_UTILIZATION) quietScore -= 28;
  else quietScore -= 10;

  if (historicalSameWindowFillRate !== null) {
    if (historicalSameWindowFillRate <= 0.25) quietScore += 16;
    else if (historicalSameWindowFillRate <= 0.45) quietScore += 8;
    else if (historicalSameWindowFillRate >= BUSY_HISTORICAL_FILL_RATE) quietScore -= 26;
  }

  quietScore = clamp(Math.round(quietScore), 0, 100);
  const currentlyBusy = currentUtilizationRate >= BUSY_CURRENT_UTILIZATION;
  const historicallyBusy = historicalSameWindowFillRate !== null
    && historicalSameWindowFillRate >= BUSY_HISTORICAL_FILL_RATE;
  const shouldSuggest = quietScore >= 55 && !currentlyBusy && !historicallyBusy;
  const demandLabel = shouldSuggest ? "quiet" : currentlyBusy || historicallyBusy ? "busy" : "normal";
  const confidence: DemandConfidence = hasEnoughHistory
    ? "high"
    : activeCurrentBookings.length > 0 || input.availableSlotCount > 0
      ? "medium"
      : "low";
  const googleCalendarBusyWindows = countGoogleCalendarWindows(activeCurrentBookings);
  const sources: DemandSourceStatus[] = [
    {
      source: "dinaya_bookings",
      status: "used",
      label: `${activeCurrentBookings.length} current bookings and ${activeHistoricalBookings.length} historical bookings checked`,
    },
    ...(input.sourceStatuses ?? []),
  ];

  if (googleCalendarBusyWindows > 0 && !sources.some((source) => source.source === "google_calendar")) {
    sources.push({
      source: "google_calendar",
      status: "used",
      label: `${googleCalendarBusyWindows} synced Google Calendar busy window${googleCalendarBusyWindows === 1 ? "" : "s"} checked`,
      busyWindowCount: googleCalendarBusyWindows,
    });
  }

  return {
    shouldSuggest,
    demandLabel,
    quietScore,
    confidence,
    currentUtilizationRate,
    currentBookingCount: activeCurrentBookings.length,
    availableSlotCount: input.availableSlotCount,
    historicalBookingCount: activeHistoricalBookings.length,
    historicalSameWindowBookedDays,
    historicalSameWindowSampleDays,
    historicalSameWindowFillRate,
    reason: formatDemandAssessmentMessage({
      demandLabel,
      quietScore,
      currentUtilizationRate,
      historicalSameWindowBookedDays,
      historicalSameWindowSampleDays,
      historicalSameWindowFillRate,
    }),
    sources,
  };
}

export function adjustDiscountForDemand(baselineDiscount: number, demand: DemandAssessment): number {
  if (demand.quietScore >= 85) return clamp(baselineDiscount + 10, 10, 50);
  if (demand.quietScore >= 70) return clamp(baselineDiscount + 5, 10, 50);
  if (demand.quietScore < 50) return clamp(baselineDiscount - 5, 10, 50);
  return baselineDiscount;
}

export function formatDemandAssessmentMessage(input: Pick<
  DemandAssessment,
  | "demandLabel"
  | "quietScore"
  | "currentUtilizationRate"
  | "historicalSameWindowBookedDays"
  | "historicalSameWindowSampleDays"
  | "historicalSameWindowFillRate"
>): string {
  const utilization = Math.round(input.currentUtilizationRate * 100);
  if (input.historicalSameWindowFillRate !== null && input.historicalSameWindowBookedDays !== null) {
    return `Demand score ${input.quietScore}/100 (${input.demandLabel}): ${utilization}% booked today, and this window filled ${input.historicalSameWindowBookedDays}/${input.historicalSameWindowSampleDays} similar days.`;
  }
  return `Demand score ${input.quietScore}/100 (${input.demandLabel}): ${utilization}% booked today, with limited history for this exact time.`;
}

export function extractDemandAssessment(meta: unknown): DemandAssessment | null {
  if (!meta || typeof meta !== "object" || !("demand" in meta)) return null;
  const demand = (meta as { demand?: unknown }).demand;
  if (!demand || typeof demand !== "object" || !("quietScore" in demand)) return null;
  return demand as DemandAssessment;
}
