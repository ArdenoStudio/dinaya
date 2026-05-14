export const metadata = { title: "Privacy Policy — Dinaya" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: May 2026</p>

      <h2>1. Who We Are</h2>
      <p>
        Dinaya is operated by Ardeno Studio, based in Sri Lanka. This policy explains what personal
        data we collect, how we use it, and your rights.
      </p>

      <h2>2. Data We Collect</h2>
      <p>When you use Dinaya we may collect:</p>
      <ul>
        <li><strong>Business owners:</strong> name, email address, business name, phone number, and billing details.</li>
        <li><strong>Clients making bookings:</strong> name, phone number, email address, and booking details.</li>
        <li><strong>Usage data:</strong> pages visited, browser type, and IP address for security and analytics.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To create and manage your account</li>
        <li>To process and confirm bookings</li>
        <li>To send booking confirmation and reminder emails</li>
        <li>To process payments via PayHere</li>
        <li>To improve and maintain the platform</li>
      </ul>

      <h2>4. Sharing Your Data</h2>
      <p>
        We do not sell your personal data. We share data only with:
      </p>
      <ul>
        <li><strong>PayHere</strong> — to process payments securely</li>
        <li><strong>Resend</strong> — to send transactional emails</li>
        <li><strong>Neon / Vercel</strong> — our infrastructure providers, who store data securely</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. If you close your account,
        booking records are retained for 12 months for legal and financial compliance, then deleted.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use session cookies required for authentication. We do not use advertising or
        third-party tracking cookies.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a>.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard security measures including encrypted connections (HTTPS) and
        hashed passwords. We never store payment card details.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:hello@ardenostudio.com">hello@ardenostudio.com</a>.
      </p>
    </article>
  );
}
