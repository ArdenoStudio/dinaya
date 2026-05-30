import Link from "next/link";
import { LegalArticle, LegalContact } from "@/components/legal/LegalArticle";

export const metadata = { title: "Terms of Service — Dinaya" };

export default function TermsPage() {
  return (
    <LegalArticle title="Terms of Service" current="terms">
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

      <h2>3. Plans &amp; Billing</h2>
      <p>
        Every new account starts with a 14-day free trial that requires no credit card. When the trial
        ends, your dashboard becomes read-only and your public booking page pauses until you subscribe
        to Pro or Max. Pro and Max are paid subscriptions billed monthly or annually through PayHere.
      </p>
      <ul>
        <li>Subscription charges renew automatically until you cancel.</li>
        <li>
          If you cancel a paid plan, you keep access to paid features until the end of your current
          billing period.
        </li>
        <li>
          Refunds for subscription charges are governed by our{" "}
          <Link href="/legal/refund">Refund Policy</Link>.
        </li>
      </ul>

      <h2>4. Bookings</h2>
      <p>
        Bookings made through Dinaya are agreements between the client and the service business.
        Ardeno Studio facilitates the booking but is not a party to the service agreement. The
        business is solely responsible for delivering the service as described.
      </p>

      <h2>5. Payments</h2>
      <p>
        Booking payments and subscription charges are processed through PayHere, a licensed payment
        gateway in Sri Lanka. By completing a payment you agree to PayHere&apos;s terms and conditions.
        Ardeno Studio does not store card details.
      </p>

      <h2>6. Cancellations &amp; Refunds</h2>
      <p>
        Cancellation and refund terms for booking payments are set by each individual business.
        Please refer to the specific business&apos;s cancellation policy before booking. Our
        platform-level refund policy is available at{" "}
        <Link href="/legal/refund">/legal/refund</Link>.
      </p>

      <h2>7. AI Features</h2>
      <p>
        Dinaya may offer AI-assisted tools for copy generation, reminders, and workflow suggestions.
        AI output is provided as a suggestion only. You are responsible for reviewing all
        AI-generated content before publishing or sending it to clients. We do not guarantee the
        accuracy, completeness, or suitability of AI-generated content.
      </p>

      <h2>8. Accounts</h2>
      <p>
        Business owners are responsible for keeping their account credentials secure. You must not
        share your login details or use another person&apos;s account without permission. If you add
        staff accounts, you are responsible for their access and activity on your account.
      </p>

      <h2>9. Acceptable Use</h2>
      <p>You must not use Dinaya to:</p>
      <ul>
        <li>Break any applicable law or regulation</li>
        <li>Post false, misleading, or fraudulent information</li>
        <li>Impersonate another person or business</li>
        <li>Send spam or unsolicited messages through the platform</li>
        <li>Scrape, reverse engineer, or attempt to disrupt the service</li>
        <li>Use AI features to generate abusive, deceptive, or unlawful content</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate these terms.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        Ardeno Studio is not liable for any loss arising from use of the platform, including missed
        appointments, payment failures, service disputes between clients and businesses, or errors in
        AI-generated content. Our total liability in any circumstance is limited to the fees paid to
        us in the preceding 30 days.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of Dinaya after changes are
        posted means you accept the updated terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these terms, contact us at <LegalContact />.
      </p>
    </LegalArticle>
  );
}
