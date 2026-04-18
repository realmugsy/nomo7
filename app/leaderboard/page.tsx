import type { Metadata } from 'next';
import LeaderboardClient from './leaderboard-client';

export const metadata: Metadata = {
  title: 'Leaderboard - Nonogram World',
  description: 'Browse daily nonogram leaderboard records and replay previous daily puzzles.',
  alternates: {
    canonical: 'https://nonogramworld.com/leaderboard',
  },
};

export default function LeaderboardPage() {
  return (
    <main className="main-container">
      <LeaderboardClient />
    </main>
  );
}
