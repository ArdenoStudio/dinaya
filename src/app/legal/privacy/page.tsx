import { LegalArticle, LegalContact } from "@/components/legal/LegalArticle";

export const metadata = { title: "Privacy Policy — Dinaya" };

export default function PrivacyPage() {
  return (
    <LegalArticle title="Privacy Policy" current="privacy">
      <h2>1. Who We Are</h2>
      <p>
        Dinaya is operated by Ardeno Studio, based in Sri Lanka. This policy explains what personal
        data we collect, how we use it, who we share it with, and your rights.
      </p>

      <h2>2. Data We Collect</h2>
      <p>When you use Dinaya we may collect:</p>
      <ul>
        <li>
          <strong>Business owners:</strong> name, email address, business name, phone number,
          billing details, staff account details, and business settings.
        </li>
        <li>
          <strong>Clients making bookings:</strong> name, phone number, email address, and booking
          details.
        </li>
        <li>
          <strong>AI feature inputs:</strong> business names, service descriptions, and other text
          you submit when using AI copy or workflow tools.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited, browser type, IP address, and anonymous
          analytics for security and product improvement.
        </li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To create and manage your account and staff access</li>
        <li>To process and confirm bookings</li>
        <li>To send booking confirmation and reminder emails</li>
        <li>To send SMS and WhatsApp reminders on Pro and Max plans, when enabled</li>
        <li>To process booking payments and Pro/Max subscription billing via PayHere</li>
        <li>To generate AI-assisted copy and workflow suggestions when you use those features</li>
        <li>To sync availability with connected services such as Google Calendar</li>
        <li>To protect the platform through rate limiting and security monitoring</li>
        <li>To improve and maintain the platform</li>
      </ul>

      <h2>4. Sharing Your Data</h2>
      <p>We do not sell your personal data. We share data only with service providers who help us run Dinaya:</p>
      <ul>
        <li><strong>PayHere</strong> — to process booking payments and subscription billing securely</li>
        <li><strong>Resend</strong> — to send transactional emails</li>
        <li><strong>Groq</strong> — to process AI feature inputs when you use AI copy or workflow tools</li>
        <li><strong>Neon / Vercel</strong> — our database and hosting providers</li>
        <li><strong>Upstash</strong> — rate limiting and abuse prevention</li>
        <li><strong>Vercel Analytics</strong> — anonymous usage metrics (no ad tracking)</li>
        <li><strong>Google Analytics (GA4)</strong> — optional platform analytics for deal discovery and booking funnels when enabled</li>
      </ul>
      <p>
        AI inputs are sent to Groq only when you actively use AI features. We do not use your
        booking client data for AI training.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. If you close your account,
        booking records are retained for 12 months for legal and financial compliance, then deleted.
        Subscription billing records may be kept longer where required for accounting or tax purposes.
      </p>

      <h2>6. Cookies &amp; Analytics</h2>
      <p>
        We use session cookies required for authentication. We also use Vercel Analytics to collect
        anonymous usage metrics that help us understand how the platform is used. When configured,
        Google Analytics (GA4) may also collect anonymous interaction events on public pages such as
        deal discovery. We do not use advertising or third-party tracking cookies beyond these
        analytics tools.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data, subject to legal and financial retention requirements</li>
      </ul>
      <p>
        To exercise any of these rights, <LegalContact />.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard security measures including encrypted connections (HTTPS) and
        hashed passwords. We never store payment card details — card data is handled by PayHere.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Contact us at <LegalContact />.
      </p>
    </LegalArticle>
  );
}
