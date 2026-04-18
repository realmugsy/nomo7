import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contacts - Nonogram World',
  description: 'Contact Nonogram World support with questions, suggestions, and bug reports.',
  alternates: {
    canonical: 'https://nonogramworld.com/contacts',
  },
};

export default function ContactsPage() {
  return (
    <main className="main-container">
      <section className="game-section legal-content">
        <h1 style={{ color: 'var(--primary-color)' }} data-i18n="footer.contacts">Contacts</h1>
        <p data-i18n="contacts_detail.intro">
          Have questions, suggestions, or found a bug in the game? We are always happy to hear from you.
        </p>
        <h2 data-i18n="contacts_detail.methods_title">Contact methods</h2>
        <div className="contact-item">
          <strong data-i18n="contacts_detail.email_label">Email:</strong> support@nonogramworld.com
        </div>
        <p style={{ marginTop: 30 }} data-i18n="contacts_detail.feedback_time">
          We try to respond to all requests within 24 hours.
        </p>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/" className="btn" data-i18n="nav.play">Back to Game</Link>
        </div>
      </section>
    </main>
  );
}
