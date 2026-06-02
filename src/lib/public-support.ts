export type PublicSupportWhatsApp = {
  href: string;
  label: string;
};

function normalizeWhatsAppNumber(raw: string | undefined): string | null {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  const normalized = digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
  return normalized.length >= 8 ? normalized : null;
}

function formatPhoneLabel(number: string): string {
  if (number.startsWith("94") && number.length === 11) {
    return `+94 ${number.slice(2, 4)} ${number.slice(4, 7)} ${number.slice(7)}`;
  }

  return `+${number}`;
}

export function getPublicSupportWhatsApp(): PublicSupportWhatsApp | null {
  const number = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER);
  if (!number) return null;

  return {
    href: `https://wa.me/${number}`,
    label: formatPhoneLabel(number),
  };
}
