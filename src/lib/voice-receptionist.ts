import type { VoiceIntegration } from "@/db/schema";

export const VOICE_RECEPTIONIST_FEATURE = "aiVoiceReceptionist" as const;

export const VOICE_STATUSES = [
  "not_requested",
  "requested",
  "configuring",
  "testing",
  "live",
  "paused",
] as const;

export type VoiceReceptionistStatus = (typeof VOICE_STATUSES)[number];

export const VOICE_STATUS_LABELS: Record<VoiceReceptionistStatus, string> = {
  not_requested: "Not requested",
  requested: "Requested",
  configuring: "Configuring",
  testing: "Testing",
  live: "Live",
  paused: "Paused",
};

export const VOICE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "si", label: "Sinhala" },
  { value: "ta", label: "Tamil" },
] as const;

export type VoiceLanguage = (typeof VOICE_LANGUAGES)[number]["value"];

export const VOICE_API_SCOPES = [
  "voice:read",
  "voice:write",
  "bookings:read",
  "bookings:write",
] as const;

export function isVoiceReceptionistStatus(value: string): value is VoiceReceptionistStatus {
  return (VOICE_STATUSES as readonly string[]).includes(value);
}

export function normalizeVoiceLanguages(input: string[] | null | undefined): VoiceLanguage[] {
  const allowed = new Set(VOICE_LANGUAGES.map((language) => language.value));
  const languages = (input ?? []).filter((value): value is VoiceLanguage => allowed.has(value as VoiceLanguage));
  return languages.length > 0 ? [...new Set(languages)] : ["en"];
}

export function voiceStatusLabel(status: string | null | undefined): string {
  return isVoiceReceptionistStatus(status ?? "")
    ? VOICE_STATUS_LABELS[status as VoiceReceptionistStatus]
    : VOICE_STATUS_LABELS.not_requested;
}

export function serializeVoiceIntegration(row: VoiceIntegration | null) {
  if (!row) return null;
  return {
    ...row,
    languages: normalizeVoiceLanguages(row.languages),
  };
}
