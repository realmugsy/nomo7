import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - Nonogram World',
  description: 'Read the Nonogram World terms of use for gameplay, fair play, and site usage.',
  alternates: {
    canonical: 'https://nonogramworld.com/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="main-container">
      <section className="game-section legal-content">
        <h1 style={{ color: 'var(--primary-color)' }} data-i18n="footer.terms">Terms of Use</h1>
        <p data-i18n="terms_detail.intro">
          Welcome to our game portal. By using this site, you agree to the following terms.
        </p>

        <h2 data-i18n="terms_detail.h1_title">1. Acceptance of terms</h2>
        <p data-i18n="terms_detail.h1_p">
          By accessing the site and using the game, you confirm that you have read, understood, and agree to these rules.
        </p>

        <h2 data-i18n="terms_detail.h2_title">2. Gameplay</h2>
        <p data-i18n="terms_detail.h2_p">
          The game is provided as is. We are not responsible for loss of local progress caused by clearing browser cache
          or storage.
        </p>

        <h2 data-i18n="terms_detail.h3_title">3. Fair play</h2>
        <p data-i18n="terms_detail.h3_p">
          We support fair play. Using third-party software to automate nonogram solving is discouraged because it removes
          the purpose of the puzzle.
        </p>

        <h2 data-i18n="terms_detail.h4_title">4. Changes</h2>
        <p data-i18n="terms_detail.h4_p">
          We reserve the right to change these terms and game functionality at any time without prior notice.
        </p>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a href="/" className="btn" data-i18n="nav.play">Back to Game</a>
        </div>
      </section>
    </main>
  );
}
