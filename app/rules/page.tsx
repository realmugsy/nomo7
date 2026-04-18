import type { Metadata } from 'next';
import RulesContent from '../rules-content';

export const metadata: Metadata = {
  title: 'Rules - Nonogram World',
  description: 'Learn how to solve nonograms with rules, examples, tips, and strategies.',
  alternates: {
    canonical: 'https://nonogramworld.com/rules',
  },
};

export default function RulesPage() {
  return (
    <main className="main-container">
      <section className="game-section rules-content">
        <RulesContent />
      </section>
    </main>
  );
}
