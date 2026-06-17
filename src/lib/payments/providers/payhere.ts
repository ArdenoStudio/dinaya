import { buildPayhereFormData, getPayhereUrl } from "@/lib/payhere";
import type { CheckoutContext } from "@/lib/payments/types";

export function createPayhereCheckout(input: CheckoutContext & {
  merchantId: string;
  merchantSecret: string;
  orderId: string;
}) {
  const nameParts = input.clientName.split(" ");
  const depositLabel = input.depositPercent > 0 ? `${input.depositPercent}% deposit for ` : "";

  const payhereFormData = buildPayhereFormData({
    orderId: input.orderId,
    amountLkr: input.amountLkr,
    itemName: `${depositLabel}${input.serviceName} - ${input.businessName}`,
    firstName: nameParts[0] ?? input.clientName,
    lastName: nameParts.slice(1).join(" "),
    email: input.clientEmail || undefined,
    phone: input.clientPhone,
    notifyUrl: `${input.appUrl}/api/webhooks/payhere`,
    returnUrl: `${input.appUrl}/book/${input.businessSlug}/confirmed?bookingId=${input.bookingId}`,
    cancelUrl: `${input.appUrl}/book/${input.businessSlug}`,
    merchantId: input.merchantId,
    merchantSecret: input.merchantSecret,
  });

  return {
    payhereFormData,
    payhereUrl: getPayhereUrl(),
  };
}
