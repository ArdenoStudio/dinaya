export const metadata = { title: "Refund Policy — Dinaya" };

export default function RefundPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Refund Policy</h1>
      <p className="text-muted-foreground">Last updated: May 2026</p>

      <h2>1. Overview</h2>
      <p>
        Dinaya is a booking platform. Payments made through Dinaya are for appointments with
        independent service businesses. Each business sets its own cancellation terms, which are
        displayed on their booking page.
      </p>

      <h2>2. Client Cancellations</h2>
      <p>
        If you need to cancel a booking, contact the business directly using the details on your
        confirmation email. Refund eligibility depends on the business&apos;s own cancellation policy:
      </p>
      <ul>
        <li>Cancellations made well in advance (typically 24+ hours) may be eligible for a full refund.</li>
        <li>Late cancellations or no-shows may not be eligible for a refund.</li>
        <li>The specific terms vary by business — check your confirmation email or the business&apos;s booking page.</li>
      </ul>

      <h2>3. Business-Initiated Cancellations</h2>
      <p>
        If a business cancels your confirmed booking, you are entitled to a full refund of any
        payment made. The business is responsible for initiating the refund within 5 business days.
      </p>

      <h2>4. Payment Failures</h2>
      <p>
        If a payment attempt fails during checkout, no charge is made to your account. If a charge
        appears without a confirmed booking, contact us immediately at{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a> and we will investigate
        with PayHere.
      </p>

      <h2>5. How Refunds Are Processed</h2>
      <p>
        Approved refunds are returned to the original payment method (card or bank account) via
        PayHere. Processing time is typically 5–10 business days depending on your bank.
      </p>

      <h2>6. Disputes</h2>
      <p>
        If you believe you were charged incorrectly or a refund was wrongly denied, email us at{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a> with your booking
        reference. We will mediate with the business and PayHere on your behalf.
      </p>

      <h2>7. Contact</h2>
      <p>
        For any refund-related queries:{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a>
      </p>
    </article>
  );
}
