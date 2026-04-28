import type { Metadata } from 'next';
import RulesContent from '../rules-content';
import { RULES_FAQ_ITEMS } from '../rules-faq';

export const metadata: Metadata = {
  title: 'Rules - Nonogram World',
  description: 'Learn how to solve nonograms with rules, examples, tips, and strategies.',
  alternates: {
    canonical: 'https://nonogramworld.com/rules',
  },
};

export default function RulesPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: RULES_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="main-container">
        <section className="game-section rules-content">
          <RulesContent />
        </section>
      </main>
    </>
  );
}
