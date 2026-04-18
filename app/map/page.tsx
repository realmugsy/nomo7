import type { Metadata } from 'next';
import MapClient from './map-client';

export const metadata: Metadata = {
  title: 'Expedition Map - Nonogram World',
  description: 'Preview the Nonogram World expedition map and subscribe for updates.',
  alternates: {
    canonical: 'https://nonogramworld.com/map',
  },
};

export default function MapPage() {
  return (
    <main className="main-container">
      <section className="game-section map-content">
        <h1 style={{ color: 'var(--primary-color)' }} data-i18n="nav.map">Expedition map</h1>
        <p style={{ marginBottom: 20 }}>Preparation for an expedition</p>
        <MapClient />
      </section>
    </main>
  );
}
