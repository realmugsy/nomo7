import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import packageJson from '../package.json';
import './globals.css';

const SITE_URL = 'https://nonogramworld.com';
const APP_VERSION = packageJson.version;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/favicon.png',
  },
};

const ThemeInitScript = `
  (function () {
    try {
      const theme = localStorage.getItem('nomo7-theme') || 'dark';
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch (_) {}
  })();
`;

const ClarityScript = `
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "vuqzjl4c2o");
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ThemeInitScript }} />
      </head>
      <body>
        <header>
          <Link href="/" className="logo">
            <img src="/favicon.png" className="logo-icon" alt="Nonogram World Logo" />
            <span data-i18n="header.logo">Nonogram World</span>
          </Link>
          <nav>
            <ul>
              <li><Link href="/" data-nav="play" data-i18n="nav.play">Play</Link></li>
              <li>
                <Link href="/daily" data-nav="daily">
                  <span data-i18n="nav.daily">Daily Puzzle</span>
                  <span className="daily-badge">NEW</span>
                </Link>
              </li>
              <li><Link href="/map" data-nav="map" data-i18n="nav.map">Map</Link></li>
              <li><Link href="/rules" data-nav="rules" data-i18n="nav.rules">Rules</Link></li>
              <li><Link href="/leaderboard" data-nav="leaderboard" data-i18n="nav.leaderboard">Leaderboard</Link></li>
            </ul>
          </nav>
          <div className="header-actions">
            <div id="lang-switcher-root" className="lang-switcher-container" style={{ minWidth: 80 }} />
            <div id="game-selectors-root" className="game-selectors-container" />
            <div id="theme-toggle-root" className="theme-toggle-container" style={{ minWidth: 40, minHeight: 40 }} />
          </div>
        </header>

        {children}

        <footer>
          <p data-i18n="footer.copy">&copy; 2026 Nonogram World. All rights reserved.</p>
          <p style={{ marginTop: 5 }}>
            <Link href="/privacy" data-i18n="footer.privacy">Privacy Policy</Link> |{' '}
            <Link href="/terms" data-i18n="footer.terms">Terms of Use</Link> |{' '}
            <Link href="/contacts" data-i18n="footer.contacts">Contacts</Link>
          </p>
          <p
            className="version-display"
            style={{ marginTop: 10, fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}
          >
            v{APP_VERSION}
          </p>
        </footer>

        <Script id="clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: ClarityScript }} />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-M0ERRD26L6" strategy="afterInteractive" />
        <Script id="ga" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-M0ERRD26L6');
          `}
        </Script>
        <Script src="/js/i18n.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
