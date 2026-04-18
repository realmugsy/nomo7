'use client';

import DailyLeaderboardPage from '../../src/components/DailyLeaderboardPage';

export default function LeaderboardClient() {
  return <DailyLeaderboardPage onBack={() => { window.location.href = '/'; }} />;
}
