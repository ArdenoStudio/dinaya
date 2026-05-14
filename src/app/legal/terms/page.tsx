export const metadata = { title: "Terms of Service — Dinaya" };

export default function TermsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: May 2026</p>

      <h2>1. About Dinaya</h2>
      <p>
        Dinaya is an online booking platform operated by Ardeno Studio. It allows service businesses
        to create booking pages and accept appointments and payments from their clients online.
      </p>

      <h2>2. Using the Platform</h2>
      <p>
        By using Dinaya — either as a business owner or as a client making a booking — you agree to
        these terms. You must be at least 18 years old to create a merchant account.
      </p>

      <h2>3. Bookings</h2>
      <p>
        Bookings made through Dinaya are agreements between the client and the service business.
        Ardeno Studio facilitates the booking but is not a party to the service agreement. The
        business is solely responsible for delivering the service as described.
      </p>

      <h2>4. Payments</h2>
      <p>
        Payments are processed through PayHere, a licensed payment gateway in Sri Lanka. By
        completing a payment you agree to PayHere&apos;s terms and conditions. Ardeno Studio does
        not store card details.
      </p>

      <h2>5. Cancellations &amp; Refunds</h2>
      <p>
        Cancellation and refund terms are set by each individual business. Please refer to the
        specific business&apos;s refund policy before booking. Our platform-level refund policy is
        available at <a href="/legal/refund">/legal/refund</a>.
      </p>

      <h2>6. Accounts</h2>
      <p>
        Business owners are responsible for keeping their account credentials secure. You must not
        share your login details or use another person&apos;s account without permission.
      </p>

      <h2>7. Acceptable Use</h2>
      <p>
        You must not use Dinaya for any unlawful purpose, to post false information, or to
        impersonate another person or business. We reserve the right to suspend accounts that
        violate these terms.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Ardeno Studio is not liable for any loss arising from use of the platform, including missed
        appointments, payment failures, or service disputes between clients and businesses. Our
        total liability in any circumstance is limited to the fees paid to us in the preceding
        30 days.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of Dinaya after changes are
        posted means you accept the updated terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        For questions about these terms, contact us at{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a>.
      </p>
    </article>
  );
}
