import { LegalArticle, LegalContact } from "@/components/legal/LegalArticle";

export const metadata = { title: "Refund Policy — Dinaya" };

export default function RefundPage() {
  return (
    <LegalArticle title="Refund Policy" current="refund">
      <h2>1. Overview</h2>
      <p>
        This policy covers two types of payments on Dinaya: booking payments between clients and
        service businesses, and subscription payments for Dinaya Pro and Max plans between
        businesses and Ardeno Studio.
      </p>

      <h2>2. Booking Payments — Client Cancellations</h2>
      <p>
        Payments made through Dinaya booking pages are for appointments with independent service
        businesses. Each business sets its own cancellation terms, which are displayed on their
        booking page.
      </p>
      <p>If you need to cancel a booking, contact the business directly using the details on your confirmation email. Refund eligibility depends on the business&apos;s own cancellation policy:</p>
      <ul>
        <li>Cancellations made well in advance (typically 24+ hours) may be eligible for a full refund.</li>
        <li>Late cancellations or no-shows may not be eligible for a refund.</li>
        <li>The specific terms vary by business — check your confirmation email or the business&apos;s booking page.</li>
      </ul>

      <h2>3. Booking Payments — Business-Initiated Cancellations</h2>
      <p>
        If a business cancels your confirmed booking, you are entitled to a full refund of any
        payment made. The business is responsible for initiating the refund within 5 business days.
      </p>

      <h2>4. Booking Payments — Processing &amp; Failures</h2>
      <p>
        If a payment attempt fails during checkout, no charge is made to your account. If a charge
        appears without a confirmed booking, contact us immediately at{" "}
        <a href="mailto:hello@dinaya.lk">hello@dinaya.lk</a> and we will investigate with PayHere.
      </p>
      <p>
        Approved booking refunds are returned to the original payment method (card or bank account)
        via PayHere. Processing time is typically 5–10 business days depending on your bank.
      </p>

      <h2>5. Dinaya Pro &amp; Max Subscriptions</h2>
      <p>
        Pro and Max are paid subscriptions billed through PayHere on a monthly or annual basis.
        These charges are between your business and Ardeno Studio, separate from booking payments
        you collect from your clients.
      </p>
      <ul>
        <li>
          <strong>14-day refund window:</strong> If you are charged for a Pro or Max plan and have
          not used the paid features meaningfully, you may request a refund of the unused portion
          within 14 days of the charge.
        </li>
        <li>
          <strong>Cancellation:</strong> You can cancel your subscription from your dashboard billing
          page. You keep access to paid features until the end of your current billing period.
        </li>
        <li>
          <strong>After 14 days:</strong> Subscription charges are generally non-refundable once the
          billing period has started, except where required by applicable law.
        </li>
      </ul>
      <p>
        To request a subscription refund, email{" "}
        <a href="mailto:hello@dinaya.lk">hello@dinaya.lk</a> with your account email and PayHere
        order ID.
      </p>

      <h2>6. Disputes</h2>
      <p>
        If you believe you were charged incorrectly or a refund was wrongly denied, email us at{" "}
        <a href="mailto:hello@dinaya.lk">hello@dinaya.lk</a> with your booking reference or
        subscription order ID. We will mediate with the relevant business and PayHere on your behalf.
      </p>

      <h2>7. Contact</h2>
      <p>
        For any refund-related queries, contact us at <LegalContact />.
      </p>
    </LegalArticle>
  );
}
