export const SLOT_HOLD_MINUTES = 5;

const STORAGE_KEY = "dinaya_booking_session";

function createToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function getBookingSessionToken(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = createToken();
    sessionStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return createToken();
  }
}
