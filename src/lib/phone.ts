export function normalizeSriLankanPhone(input: string): string {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("0094")) {
    return `+94${digits.slice(4)}`;
  }

  if (digits.startsWith("94")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return `+94${digits.slice(1)}`;
  }

  return raw.startsWith("+") ? `+${digits}` : digits;
}

export function toWhatsAppPhone(input: string): string {
  return normalizeSriLankanPhone(input).replace(/\D/g, "");
}
