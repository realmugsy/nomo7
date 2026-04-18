import type { Metadata } from 'next';
import Link from 'next/link';
import GameClient from './game-client';

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
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center text-2xl font-bold text-blue-500 dark:text-blue-400"
            data-i18n="home_intro.title"
          >
            Welcome to Nonogram World
          </h2>
          <div className="mt-5 space-y-4 text-slate-700 dark:text-slate-300">
            <p data-i18n="home_intro.p1">
              Nonogram World is a free online puzzle game where logic is your only tool. Each day brings a new
              nonogram — a grid-based picture puzzle solved through pure deduction, no guessing required.
            </p>
            <p data-i18n="home_intro.p2">
              Choose your challenge: play the Daily Puzzle that resets every 24 hours for players worldwide, or start a
              new random game anytime. Puzzles range from compact 10×10 grids to demanding 20×20 challenges.
            </p>
            <p>
              <span data-i18n="home_intro.p3_prefix">
                New to nonograms? Check out our
              </span>{' '}
              <Link href="/rules" className="font-semibold text-blue-600 hover:underline dark:text-blue-400" data-i18n="home_intro.rules_link">
                Rules & Strategy guide
              </Link>{' '}
              <span data-i18n="home_intro.p3_suffix">
                to learn how to read clues, apply the overlap method, and solve any puzzle step by step.
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
