import { convertLkrToUsd } from "@/lib/payments/amounts";
import type { CheckoutContext } from "@/lib/payments/types";

const SANDBOX = process.env.PAYPAL_SANDBOX === "true";

export function getPaypalApiBase(): string {
  return SANDBOX ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

export function getPaypalWebBase(): string {
  return SANDBOX ? "https://www.sandbox.paypal.com" : "https://www.paypal.com";
}

type AccessTokenResponse = {
  access_token?: string;
  error?: string;
};

export async function getPaypalAccessToken(input: {
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const credentials = Buffer.from(`${input.clientId}:${input.clientSecret}`).toString("base64");
  const res = await fetch(`${getPaypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await res.json()) as AccessTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error ?? "PayPal authentication failed.");
  }

  return data.access_token;
}

type PaypalOrderResponse = {
  id?: string;
  status?: string;
  links?: Array<{ rel: string; href: string }>;
  message?: string;
};

export async function createPaypalCheckout(input: CheckoutContext & {
  clientId: string;
  clientSecret: string;
  paymentId: string;
}): Promise<{ orderId: string; approvalUrl: string; amountUsd: number }> {
  const accessToken = await getPaypalAccessToken({
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  });

  const amountUsd = convertLkrToUsd(input.amountLkr);
  const depositLabel = input.depositPercent > 0 ? `${input.depositPercent}% deposit for ` : "";

  const res = await fetch(`${getPaypalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.bookingId,
          custom_id: input.bookingId,
          invoice_id: input.paymentId,
          description: `${depositLabel}${input.serviceName} - ${input.businessName}`,
          amount: {
            currency_code: "USD",
            value: amountUsd.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: input.businessName,
        user_action: "PAY_NOW",
        return_url: `${input.appUrl}/book/${input.businessSlug}/pay/return?bookingId=${input.bookingId}`,
        cancel_url: `${input.appUrl}/book/${input.businessSlug}`,
      },
    }),
  });

  const data = (await res.json()) as PaypalOrderResponse;
  if (!res.ok || !data.id) {
    throw new Error(data.message ?? "PayPal checkout could not be created.");
  }

  const approvalUrl = data.links?.find((link) => link.rel === "approve")?.href;
  if (!approvalUrl) {
    throw new Error("PayPal approval URL missing.");
  }

  return { orderId: data.id, approvalUrl, amountUsd };
}

type CaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value?: string } }> };
  }>;
  message?: string;
};

export async function capturePaypalOrder(input: {
  clientId: string;
  clientSecret: string;
  orderId: string;
}): Promise<{ status: string; captureId?: string; payload: unknown }> {
  const accessToken = await getPaypalAccessToken({
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  });

  const res = await fetch(`${getPaypalApiBase()}/v2/checkout/orders/${input.orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await res.json()) as CaptureResponse;
  if (!res.ok) {
    throw new Error(data.message ?? "PayPal capture failed.");
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: capture?.status ?? data.status ?? "UNKNOWN",
    captureId: capture?.id,
    payload: data,
  };
}

export async function getPaypalOrder(input: {
  clientId: string;
  clientSecret: string;
  orderId: string;
}): Promise<{ status: string; approvalUrl?: string; payload: unknown }> {
  const accessToken = await getPaypalAccessToken({
    clientId: input.clientId,
    clientSecret: input.clientSecret,
  });

  const res = await fetch(`${getPaypalApiBase()}/v2/checkout/orders/${input.orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = (await res.json()) as PaypalOrderResponse;
  if (!res.ok) {
    throw new Error(data.message ?? "PayPal order lookup failed.");
  }

  const approvalUrl = data.links?.find((link) => link.rel === "approve")?.href;

  return {
    status: data.status ?? "UNKNOWN",
    approvalUrl,
    payload: data,
  };
}
