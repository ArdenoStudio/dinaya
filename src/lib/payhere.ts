import crypto from "crypto";
import { timingSafeEqual } from "node:crypto";

export interface PayhereCheckoutParams {
  orderId: string;
  amountLkr: number;
  itemName: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
  merchantId: string;
  merchantSecret: string;
}

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function generatePayhereHash({
  merchantId,
  orderId,
  amountLkr,
  merchantSecret,
}: {
  merchantId: string;
  orderId: string;
  amountLkr: number;
  merchantSecret: string;
}): string {
  const amount = amountLkr.toFixed(2);
  const currency = "LKR";
  const hashedSecret = md5(merchantSecret);
  const raw = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`;
  return md5(raw);
}

export function buildPayhereFormData(params: PayhereCheckoutParams): Record<string, string> {
  const amount = params.amountLkr.toFixed(2);
  const hash = generatePayhereHash({
    merchantId: params.merchantId,
    orderId: params.orderId,
    amountLkr: params.amountLkr,
    merchantSecret: params.merchantSecret,
  });

  return {
    merchant_id: params.merchantId,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
    order_id: params.orderId,
    items: params.itemName,
    currency: "LKR",
    amount,
    first_name: params.firstName,
    last_name: params.lastName ?? "",
    email: params.email ?? "",
    phone: params.phone,
    address: "",
    city: "",
    country: "Sri Lanka",
    hash,
  };
}

export function verifyPayhereWebhook({
  merchantId,
  orderId,
  payhereAmount,
  payhereCurrency,
  statusCode,
  md5sig,
  merchantSecret,
}: {
  merchantId: string;
  orderId: string;
  payhereAmount: string;
  payhereCurrency: string;
  statusCode: string;
  md5sig: string;
  merchantSecret: string;
}): boolean {
  const hashedSecret = md5(merchantSecret);
  const raw = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
  const expected = md5(raw);
  return timingSafeStringEqual(expected, md5sig.toUpperCase());
}

export function getPayhereUrl(): string {
  const sandbox = process.env.PAYHERE_SANDBOX === "true";
  return sandbox
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";
}

export function payhereAmountMatches(amountLkr: number, payhereAmount: string): boolean {
  return payhereAmount === amountLkr.toFixed(2);
}
