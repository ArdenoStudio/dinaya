export const API_KEY_SCOPES = [
  "bookings:read",
  "bookings:write",
  "voice:read",
  "voice:write",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export function isApiKeyScope(value: string): value is ApiKeyScope {
  return (API_KEY_SCOPES as readonly string[]).includes(value);
}
