import type { PaymentBusinessConfig, PaymentMethodChoice } from "@/lib/payments/types";

export function isLikelySriLankanPhone(phone: string): boolean {
  const normalized = phone.replace(/\s+/g, "");
  return normalized.startsWith("+94") || normalized.startsWith("94") || normalized.startsWith("07");
}

export function getAvailablePaymentMethods(
  business: PaymentBusinessConfig,
  requiresPayment: boolean,
  amountLkr: number,
  hasPayhereSecret: boolean,
  hasPaypalSecret: boolean,
): PaymentMethodChoice[] {
  if (!requiresPayment || amountLkr <= 0) return [];

  const methods: PaymentMethodChoice[] = [];

  if (business.payhereEnabled && business.payhereMerchantId && hasPayhereSecret) {
    methods.push("payhere");
  }

  if (business.paypalEnabled && business.paypalClientId && hasPaypalSecret) {
    methods.push("paypal");
  }

  if (business.bankTransferInstructions || business.lankaqrImageUrl) {
    methods.push("manual");
  }

  return methods;
}

export function resolveDefaultPaymentMethod(
  methods: PaymentMethodChoice[],
  clientPhone: string,
): PaymentMethodChoice | null {
  if (methods.length === 0) return null;
  if (methods.length === 1) return methods[0]!;

  const local = isLikelySriLankanPhone(clientPhone);
  if (local && methods.includes("payhere")) return "payhere";
  if (!local && methods.includes("paypal")) return "paypal";
  return methods.find((method) => method !== "manual") ?? methods[0]!;
}

export function resolveOnlinePaymentMethod(input: {
  methods: PaymentMethodChoice[];
  requested?: "payhere" | "paypal" | null;
  clientPhone: string;
}): "payhere" | "paypal" | null {
  const online = input.methods.filter((method) => method === "payhere" || method === "paypal");
  if (online.length === 0) return null;

  if (input.requested && online.includes(input.requested)) {
    return input.requested;
  }

  return resolveDefaultPaymentMethod(online, input.clientPhone) as "payhere" | "paypal";
}
