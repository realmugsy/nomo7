import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Nonogram World',
  description: 'Read the Nonogram World privacy policy and learn how browser storage and analytics are used.',
  alternates: {
    canonical: 'https://nonogramworld.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className="main-container">
      <section className="game-section legal-content">
        <h1 style={{ color: 'var(--primary-color)' }} data-i18n="footer.privacy">Privacy Policy</h1>
        <p data-i18n="privacy_detail.intro">
          We respect your privacy and strive to protect your personal data. This policy explains how we process information.
        </p>

        <h2 data-i18n="privacy_detail.h1_title">1. Information collection</h2>
        <p data-i18n="privacy_detail.h1_p">
          The application works primarily on the client side. We do not collect personal data such as your name or email
          address without your explicit consent.
        </p>

        <h2 data-i18n="privacy_detail.h2_title">2. Data usage</h2>
        <p data-i18n="privacy_detail.h2_p">
          We use browser localStorage to remember your settings, such as:
        </p>
        <ul>
          <li data-i18n="privacy_detail.h2_li1">Selected color theme.</li>
          <li data-i18n="privacy_detail.h2_li2">Your game progress.</li>
          <li data-i18n="privacy_detail.h2_li3">The number of in-game coins.</li>
        </ul>

        <h2 data-i18n="privacy_detail.h3_title">3. Cookies</h2>
        <p data-i18n="privacy_detail.h3_p">
          We may use cookies for analytics to understand how users interact with the game portal and improve it.
        </p>

        <h2 data-i18n="privacy_detail.h4_title">4. Third-party services</h2>
        <p data-i18n="privacy_detail.h4_p">
          The game may use external services for analytics and site functionality. Personal gameplay data is not shared
          without consent.
        </p>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/" className="btn" data-i18n="nav.play">Back to Game</Link>
        </div>
      </section>
    </main>
  );
}
