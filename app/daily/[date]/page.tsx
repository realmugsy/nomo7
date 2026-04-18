import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GameClient from '../../game-client';
import { getDailyPuzzleConfig } from '../../../src/gameConfig';

interface DailyPageProps {
  params: {
    date: string;
  };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDailyDate = (date: string) => {
  if (!DATE_PATTERN.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== date) return null;
  return parsed;
};

const formatDailyDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export function generateMetadata({ params }: DailyPageProps): Metadata {
  const dailyDate = parseDailyDate(params.date);
  if (!dailyDate) {
    return {
      title: 'Daily Puzzle - Nonogram World',
    };
  }

  const config = getDailyPuzzleConfig(dailyDate);
  const formattedDate = formatDailyDate(dailyDate);

  return {
    title: `Daily Nonogram — ${formattedDate} — Nonogram World`,
    description: `Play the daily nonogram puzzle for ${formattedDate}. A ${config.size}×${config.size} grid logic puzzle. Free to play, no registration required.`,
    alternates: {
      canonical: `https://nonogramworld.com/daily/${params.date}`,
    },
  };
}

export default function DailyPage({ params }: DailyPageProps) {
  const dailyDate = parseDailyDate(params.date);
  if (!dailyDate) notFound();

  return (
    <main className="main-container">
      <div className="game-wrapper" style={{ position: 'relative', height: 'auto' }}>
        <GameClient dailyDate={params.date} />
      </div>
    </main>
  );
}
