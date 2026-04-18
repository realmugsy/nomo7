import type { Metadata } from 'next';
import GameClient from './game-client';
import RulesContent from './rules-content';

export const metadata: Metadata = {
  title: 'Nonogram World - Free Online Nonogram Puzzles',
  description: 'Play free nonogram puzzles online. Daily nonograms, rules, tips, and logic puzzle fun for all ages.',
  alternates: {
    canonical: 'https://nonogramworld.com/',
  },
};

export default function HomePage() {
  return (
    <main className="main-container">
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1>Play Nonogram Puzzles Online</h1>
        <p>
          Nonogram World is a free online logic puzzle game. Solve nonograms daily and train your brain.
        </p>
      </div>

      <div className="game-wrapper" style={{ position: 'relative', height: 'auto' }}>
        <GameClient />
      </div>

      <div className="panel how-to-play-panel rules-content" style={{ marginTop: 20 }}>
        <RulesContent showBack={false} />
      </div>
    </main>
  );
}
