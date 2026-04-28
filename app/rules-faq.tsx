export const RULES_FAQ_ITEMS = [
  {
    key: 'q1',
    question: 'What are the rules of nonograms?',
    answer:
      'Nonograms are picture logic puzzles. The numbers beside each row and column tell you how many consecutive cells must be filled. Separate number groups always need at least one empty cell between them.',
  },
  {
    key: 'q2',
    question: 'How do I solve a nonogram?',
    answer:
      'Start with the largest clues and use overlap. If a block can fit in several positions, the cells shared by every possible position are guaranteed to be filled.',
  },
  {
    key: 'q3',
    question: 'Do nonograms require guessing?',
    answer:
      'Good nonograms do not require guessing. Each move should follow from the row and column clues, using deduction, elimination, and confirmed empty cells.',
  },
  {
    key: 'q4',
    question: 'Easy vs Hard nonograms?',
    answer:
      'Easy nonograms use smaller grids and more obvious clues. Hard nonograms have larger grids, more possible placements, and require longer chains of logical deductions.',
  },
  {
    key: 'q5',
    question: 'How long does it take?',
    answer:
      'Solve time depends on size and difficulty. A 10×10 puzzle can take a few minutes, while a 20×20 puzzle can take 20–40 minutes or more.',
  },
];

const Cell = ({
  x,
  y,
  fill = '#2a3142',
  stroke = '#4a9eff',
  opacity = 1,
}: {
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
}) => (
  <rect x={x} y={y} width="22" height="22" rx="2" fill={fill} stroke={stroke} strokeOpacity="0.35" opacity={opacity} />
);

const RulesStructureSvg = () => {
  const filled = new Set(['1-2', '2-1', '2-2', '2-3', '3-2']);
  const rows = ['1', '3', '1', '0', '0'];
  const cols = ['0', '1', '3', '1', '0'];

  return (
    <svg viewBox="0 0 210 180" className="h-auto w-full max-w-[260px]" role="img" aria-label="5 by 5 nonogram grid with row and column clues">
      <rect width="210" height="180" rx="14" fill="#1a1f2e" />
      {cols.map((hint, i) => (
        <text key={i} x={64 + i * 24} y="30" fill="#4a9eff" fontSize="15" fontWeight="700" textAnchor="middle">{hint}</text>
      ))}
      {rows.map((hint, i) => (
        <text key={i} x="32" y={56 + i * 24} fill="#4a9eff" fontSize="15" fontWeight="700" textAnchor="middle">{hint}</text>
      ))}
      {Array.from({ length: 5 }).map((_, r) => (
        Array.from({ length: 5 }).map((__, c) => (
          <Cell key={`${r}-${c}`} x={52 + c * 24} y={42 + r * 24} fill={filled.has(`${r}-${c}`) ? '#4a9eff' : '#2a3142'} />
        ))
      ))}
    </svg>
  );
};

const OverlapSvg = () => (
  <svg viewBox="0 0 230 180" className="h-auto w-full max-w-[280px]" role="img" aria-label="Overlap method on a five cell row with clue four">
    <rect width="230" height="180" rx="14" fill="#1a1f2e" />
    <text x="32" y="87" fill="#4a9eff" fontSize="18" fontWeight="700" textAnchor="middle">4</text>
    {Array.from({ length: 5 }).map((_, c) => (
      <Cell key={c} x={54 + c * 28} y={66} fill={c >= 1 && c <= 3 ? '#4a9eff' : '#596273'} stroke="#4a9eff" />
    ))}
    <path d="M92 122 H162" stroke="#4a9eff" strokeWidth="3" strokeLinecap="round" />
    <path d="M154 114 L164 122 L154 130" fill="none" stroke="#4a9eff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <text x="128" y="150" fill="#e0e0e0" fontSize="14" fontWeight="700" textAnchor="middle">overlap zone</text>
  </svg>
);

const NoGuessingSvg = () => (
  <svg viewBox="0 0 250 180" className="h-auto w-full max-w-[300px]" role="img" aria-label="No guessing compared with logical deduction">
    <rect width="250" height="180" rx="14" fill="#1a1f2e" />
    <g transform="translate(26 42)">
      {Array.from({ length: 3 }).map((_, r) => (
        Array.from({ length: 3 }).map((__, c) => (
          <Cell key={`${r}-${c}`} x={c * 24} y={r * 24} fill="#2a3142" />
        ))
      ))}
      <text x="36" y="49" fill="#e0e0e0" fontSize="28" fontWeight="800" textAnchor="middle">?</text>
      <path d="M18 94 L58 94 M58 82 L18 106" stroke="#ef6b73" strokeWidth="5" strokeLinecap="round" />
      <text x="36" y="126" fill="#e0e0e0" fontSize="12" textAnchor="middle">no guessing</text>
    </g>
    <g transform="translate(146 42)">
      {Array.from({ length: 3 }).map((_, r) => (
        Array.from({ length: 3 }).map((__, c) => (
          <Cell key={`${r}-${c}`} x={c * 24} y={r * 24} fill={r === 1 && c === 1 ? '#4a9eff' : '#2a3142'} />
        ))
      ))}
      <path d="M6 92 H58" stroke="#4a9eff" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 84 L60 92 L50 100" fill="none" stroke="#4a9eff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 126 L34 138 L58 108" fill="none" stroke="#54d68a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const DifficultySvg = () => (
  <svg viewBox="0 0 280 180" className="h-auto w-full max-w-[320px]" role="img" aria-label="Beginner and expert nonogram grids side by side">
    <rect width="280" height="180" rx="14" fill="#1a1f2e" />
    <text x="72" y="28" fill="#e0e0e0" fontSize="14" fontWeight="700" textAnchor="middle">10×10 / Beginner</text>
    <g transform="translate(22 48)">
      {Array.from({ length: 5 }).map((_, r) => (
        Array.from({ length: 5 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * 18} y={r * 18} width="16" height="16" rx="2" fill={(r + c) % 3 === 0 ? '#4a9eff' : '#2a3142'} stroke="#4a9eff" strokeOpacity="0.3" />
        ))
      ))}
    </g>
    <text x="204" y="28" fill="#e0e0e0" fontSize="14" fontWeight="700" textAnchor="middle">20×20 / Expert</text>
    <g transform="translate(144 42)">
      {Array.from({ length: 8 }).map((_, r) => (
        Array.from({ length: 8 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * 13} y={r * 13} width="11" height="11" rx="1.5" fill={(r * c + c) % 4 === 0 ? '#4a9eff' : '#2a3142'} stroke="#4a9eff" strokeOpacity="0.28" />
        ))
      ))}
    </g>
  </svg>
);

const TimeSvg = () => {
  const rows = [
    ['10×10', '3–10 min', 34],
    ['12×12', '5–15 min', 58],
    ['15×15', '10–25 min', 86],
    ['20×20', '20–40 min', 126],
  ] as const;

  return (
    <svg viewBox="0 0 280 180" className="h-auto w-full max-w-[320px]" role="img" aria-label="Timeline showing solve times for nonogram grid sizes">
      <rect width="280" height="180" rx="14" fill="#1a1f2e" />
      <circle cx="38" cy="34" r="16" fill="#2a3142" stroke="#4a9eff" strokeWidth="3" />
      <path d="M38 24 V34 L47 40" fill="none" stroke="#e0e0e0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="70" y1="34" x2="238" y2="34" stroke="#4a9eff" strokeWidth="3" strokeLinecap="round" />
      {rows.map(([size, time, width], i) => (
        <g key={size} transform={`translate(28 ${62 + i * 25})`}>
          <text x="0" y="13" fill="#e0e0e0" fontSize="13" fontWeight="700">{size}</text>
          <rect x="54" y="2" width={width} height="14" rx="7" fill="#4a9eff" opacity="0.95" />
          <text x="190" y="13" fill="#e0e0e0" fontSize="13">{time}</text>
        </g>
      ))}
    </svg>
  );
};

const FAQ_SVGS = [
  <RulesStructureSvg key="rules" />,
  <OverlapSvg key="overlap" />,
  <NoGuessingSvg key="guessing" />,
  <DifficultySvg key="difficulty" />,
  <TimeSvg key="time" />,
];

export const RulesFaq = () => (
  <section className="mt-12">
    <h2 className="mb-6 text-center text-3xl font-bold text-blue-400" data-i18n="rules_faq.title">Nonogram FAQ</h2>
    <div className="flex flex-col gap-6">
      {RULES_FAQ_ITEMS.map((item, index) => (
        <article
          key={item.question}
          className="grid gap-6 rounded-lg border border-slate-700 bg-[#1a1f2e] p-5 shadow-lg md:grid-cols-[1fr_320px] md:items-center"
        >
          <div>
            <h3 className="text-xl font-bold text-[#e0e0e0]" data-i18n={`rules_faq.items.${item.key}.question`}>{item.question}</h3>
            <p className="mt-3 text-base leading-7 text-slate-300" data-i18n={`rules_faq.items.${item.key}.answer`}>{item.answer}</p>
          </div>
          <div className="flex justify-center md:justify-end">
            {FAQ_SVGS[index]}
          </div>
        </article>
      ))}
    </div>
  </section>
);
