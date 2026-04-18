import type { Metadata } from 'next';
import Link from 'next/link';
import { getDailyPuzzleConfig } from '../../src/gameConfig';

export const metadata: Metadata = {
  title: 'Daily Nonogram Puzzles Archive — Nonogram World',
  description: 'Browse and play all daily nonogram puzzles from January 2026. A new puzzle every day — 10×10, 12×12, 15×15, and 20×20 grids.',
  alternates: {
    canonical: 'https://nonogramworld.com/daily',
  },
};

interface DailyArchiveEntry {
  date: Date;
  dateKey: string;
  readableDate: string;
  size: number;
}

interface MonthGroup {
  monthKey: string;
  monthTitle: string;
  entries: DailyArchiveEntry[];
}

const FIRST_DAILY_DATE = '2026-01-01';

const toUtcDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReadableDate = (date: Date) => (
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
);

const formatMonthTitle = (date: Date) => (
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
);

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getDailyArchiveGroups = (): MonthGroup[] => {
  const start = new Date(`${FIRST_DAILY_DATE}T00:00:00.000Z`);
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const entries: DailyArchiveEntry[] = [];

  for (let current = start; current <= end; current = addUtcDays(current, 1)) {
    const config = getDailyPuzzleConfig(current);
    entries.push({
      date: current,
      dateKey: toUtcDateKey(current),
      readableDate: formatReadableDate(current),
      size: config.size,
    });
  }

  entries.reverse();

  const groups = new Map<string, MonthGroup>();
  for (const entry of entries) {
    const monthKey = `${entry.date.getUTCFullYear()}-${String(entry.date.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(monthKey)) {
      groups.set(monthKey, {
        monthKey,
        monthTitle: formatMonthTitle(entry.date),
        entries: [],
      });
    }

    groups.get(monthKey)!.entries.push(entry);
  }

  return Array.from(groups.values());
};

export default function DailyArchivePage() {
  const groups = getDailyArchiveGroups();

  return (
    <main className="main-container">
      <section className="game-section rules-content">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-500 dark:text-blue-400">
              Daily Nonogram Puzzles Archive
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Browse every daily puzzle from January 2026 through today.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.monthKey} className="flex flex-col gap-3">
                <h2 className="border-b border-slate-300 pb-2 text-xl font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                  {group.monthTitle}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry.dateKey}
                      href={`/daily/${entry.dateKey}`}
                      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-400"
                    >
                      <span className="block font-semibold text-slate-900 dark:text-slate-100">
                        {entry.readableDate}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                        {entry.size}×{entry.size} grid
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
