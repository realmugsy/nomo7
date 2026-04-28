import Link from 'next/link';
import { RulesFaq } from './rules-faq';

export default function RulesContent({ showBack = true }: { showBack?: boolean }) {
  return (
    <>
      <h2
        style={{ marginTop: 30, marginBottom: 25, textAlign: 'center', fontSize: '2rem', color: 'var(--primary-color)' }}
        data-i18n="rules_detail.title"
      >
        How to Solve Nonograms
      </h2>

      <p data-i18n="rules_detail.intro_p1">
        Nonograms (also known as Griddlers or Japanese Crosswords) are picture logic puzzles where you must decode a
        hidden image using numbers placed along the edges of the grid. Each number represents the length of a continuous
        block of filled cells in that specific row or column. A fundamental rule is that there must be at least one
        empty (unfilled) cell separating any two adjacent blocks of filled cells.
      </p>
      <p data-i18n="rules_detail.intro_p2" style={{ marginTop: 15 }}>
        The solving process is based on strict deduction: you analyze the intersections of horizontal and vertical
        lines, gradually filling in cells that must logically be shaded. The game is considered complete when all
        numerical requirements are met, revealing a silhouette or a pixel-art image. Nonograms do not require guessing;
        any well-designed puzzle has only one logically correct solution that can be found through the process of
        elimination.
      </p>

      <h2
        data-i18n="rules_detail.tips_title"
        style={{ marginTop: 50, marginBottom: 25, textAlign: 'center', fontSize: '2rem', color: 'var(--primary-color)' }}
      >
        Tips and Strategies for Success
      </h2>
      <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: 15, lineHeight: 1.4 }}>
        {[
          ['tip1', 'Start with the Largest Numbers', 'If a number in a row matches the full width or height of the grid, fill it in entirely without hesitation.'],
          ['tip2', 'Use the Overlap Method', "If the sum of the numbers in a row (plus the mandatory gaps) covers more than half the length, you can calculate the 'overlap' cells that will be filled regardless of the exact placement."],
          ['tip3', "Mark Empty Cells with 'X's", "This is absolutely critical. As soon as you determine a cell cannot be filled, mark it with an 'X' to narrow down your search area."],
          ['tip4', "Look for 'Zero' Rows", "If a row or column has a '0' or no numbers at all, immediately cross out the entire line with 'X's."],
          ['tip5', 'Anchor the Edges', 'If a filled cell is located right against the edge of the grid, it must be part of the first (or last) number group for that row or column.'],
          ['tip6', 'Cross Off Completed Numbers', 'Once you have fully formed a block of cells corresponding to a number, cross that number off your clue list to stay organized.'],
          ['tip7', 'Seal Your Blocks', "Once a group of cells is completed, place an 'X' on both ends of it to prevent the block from accidentally being extended."],
          ['tip8', 'Use the Elimination Method', 'If a specific number group cannot physically fit into a remaining gap, you know that space must be empty.'],
          ['tip9', 'Check Intersections', 'Every cell you fill in a row must simultaneously satisfy the rules of its intersecting column.'],
          ['tip10', 'Never Guess', 'A single mistake early on can ruin the entire logical chain. If you are stuck, look for a clue elsewhere on the board.'],
          ['tip11', 'Work Inward from the Borders', 'It is often easiest to find hooks in the corner cells or the outermost rows, as they have the fewest placement options.'],
          ['tip12', 'Identify Unreachable Gaps', 'If the distance between two filled cells is smaller than the minimum block size required for that row, those cells cannot be connected.'],
          ['tip13', 'Separate Your Blocks', "If there is an 'X' between two filled sections, it guarantees they belong to different number clues."],
          ['tip14', 'Look for Impossible Positions', 'If placing a block in a certain spot creates a contradiction in the perpendicular row, that spot must be marked as empty.'],
          ['tip15', 'Move from Simple to Complex', "Fill in the obvious rows first (e.g., a '10' in a 10-cell row), then move on to analyzing smaller, more ambiguous numbers."],
          ['tip16', 'Notice Symmetry', "Many simple nonograms are symmetrical; while you shouldn't rely on it entirely, it can often point you in the right direction."],
          ['tip17', 'Calculate Total Length', "Always remember the 'minimum length' of a row is the sum of all its numbers plus one empty space between each."],
          ['tip18', 'Marking Empty Cells Organizes Chaos', "Without 'X' marks, the board becomes visually cluttered, making it impossible to accurately judge the remaining playable space."],
        ].map(([key, title, text]) => (
          <li key={key} style={{ marginBottom: 8 }}>
            <strong data-i18n={`rules_detail.tips.${key}_title`}>{title}</strong>:{' '}
            <span data-i18n={`rules_detail.tips.${key}_text`}>{text}</span>
          </li>
        ))}
      </ul>

      {showBack && <RulesFaq />}

      {showBack && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/" className="btn" data-i18n="rules_detail.back">Return to the game</Link>
        </div>
      )}
    </>
  );
}
