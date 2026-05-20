import crypto from "crypto";

// ── Dinaya's own PayHere merchant account (for billing Pro plan) ───────────
// These are separate from the per-business PayHere creds stored on `businesses`.
// Set in the project env: DINAYA_PAYHERE_MERCHANT_ID, DINAYA_PAYHERE_MERCHANT_SECRET
// For the Subscription Manager API (cancel/retry from server): DINAYA_PAYHERE_APP_ID,
// DINAYA_PAYHERE_APP_SECRET — these come from a "Business App" in the PayHere dashboard.

const SANDBOX = process.env.PAYHERE_SANDBOX === "true";

export const PAYHERE_CHECKOUT_URL = SANDBOX
  ? "https://sandbox.payhere.lk/pay/checkout"
  : "https://www.payhere.lk/pay/checkout";

const SUB_MANAGER_BASE = SANDBOX
  ? "https://sandbox.payhere.lk/merchant/v1/subscription"
  : "https://www.payhere.lk/merchant/v1/subscription";

const OAUTH_URL = SANDBOX
  ? "https://sandbox.payhere.lk/merchant/v1/oauth/token"
  : "https://www.payhere.lk/merchant/v1/oauth/token";

function md5(s: string): string {
  return crypto.createHash("md5").update(s).digest("hex").toUpperCase();
}

function hashSecret(secret: string): string {
  return md5(secret);
}

export function generateRecurringHash({
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
  const raw = `${merchantId}${orderId}${amount}LKR${hashSecret(merchantSecret)}`;
  return md5(raw);
}

interface RecurringCheckoutParams {
  orderId: string;
  amountLkr: number;
  itemName: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
  /** e.g. "1 Month" — billing cycle */
  recurrence: string;
  /** e.g. "Forever" or "1 Year" — total subscription duration */
  duration: string;
  /** Optional one-time setup charge alongside the first payment */
  startupFeeLkr?: number;
}

export function buildRecurringFormData(params: RecurringCheckoutParams): Record<string, string> {
  const merchantId = process.env.DINAYA_PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.DINAYA_PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    throw new Error("Dinaya PayHere merchant credentials are not configured.");
  }

  const amount = params.amountLkr.toFixed(2);
  const hash = generateRecurringHash({
    merchantId,
    orderId: params.orderId,
    amountLkr: params.amountLkr,
    merchantSecret,
  });

  const form: Record<string, string> = {
    merchant_id: merchantId,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
    order_id: params.orderId,
    items: params.itemName,
    currency: "LKR",
    amount,
    first_name: params.firstName,
    last_name: params.lastName ?? "",
    email: params.email,
    phone: params.phone,
    address: "",
    city: "",
    country: "Sri Lanka",
    recurrence: params.recurrence,
    duration: params.duration,
    hash,
  };

  if (params.startupFeeLkr) {
    form.startup_fee = params.startupFeeLkr.toFixed(2);
  }

  return form;
}

export function verifyRecurringWebhook({
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
  const raw = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashSecret(merchantSecret)}`;
  return md5(raw) === md5sig.toUpperCase();
}

// ── Subscription Manager API (server-to-server) ────────────────────────────

interface CachedToken {
  value: string;
  expiresAt: number;
}
let cachedToken: CachedToken | null = null;

export async function getPayhereAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const appId = process.env.DINAYA_PAYHERE_APP_ID;
  const appSecret = process.env.DINAYA_PAYHERE_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Dinaya PayHere Business App credentials are not configured.");
  }

  const basic = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayHere auth failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function cancelPayhereSubscription(subscriptionId: string): Promise<void> {
  const token = await getPayhereAuthToken();
  const res = await fetch(`${SUB_MANAGER_BASE}/${subscriptionId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PayHere subscription cancel failed: ${res.status} ${body}`);
  }
}
