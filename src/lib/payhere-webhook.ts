export function parsePayhereWebhookFields(form: FormData): {
  merchantId: string;
  orderId: string;
  payhereAmount: string;
  payhereCurrency: string;
  statusCode: string;
  md5sig: string;
} | null {
  const merchantId = form.get("merchant_id");
  const orderId = form.get("order_id");
  const payhereAmount = form.get("payhere_amount");
  const payhereCurrency = form.get("payhere_currency");
  const statusCode = form.get("status_code");
  const md5sig = form.get("md5sig");

  if (
    typeof merchantId !== "string" ||
    typeof orderId !== "string" ||
    typeof payhereAmount !== "string" ||
    typeof payhereCurrency !== "string" ||
    typeof statusCode !== "string" ||
    typeof md5sig !== "string" ||
    !merchantId ||
    !orderId ||
    !payhereAmount ||
    !payhereCurrency ||
    !statusCode ||
    !md5sig
  ) {
    return null;
  }

  return { merchantId, orderId, payhereAmount, payhereCurrency, statusCode, md5sig };
}
