import React, { useMemo } from 'react';

interface HintsProps {
  line: number[];
  type: 'row' | 'col';
  isComplete?: boolean;
  puzzleSize: number;
  hiddenIndices?: Set<number>;
}

const Hints: React.FC<HintsProps> = ({ line, type, isComplete, puzzleSize, hiddenIndices }) => {
  const hints = useMemo(() => {
    const calculatedHints: number[] = [];
    let count = 0;
    for (const cell of line) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        calculatedHints.push(count);
        count = 0;
      }
    }
    if (count > 0) calculatedHints.push(count);
    if (calculatedHints.length === 0) calculatedHints.push(0);
    return calculatedHints;
  }, [line]);

  const textColor = isComplete ? "text-emerald-400" : "text-slate-400";

  let textSizeClass = "text-sm md:text-base";
  if (puzzleSize > 15) textSizeClass = "text-[8px] leading-[8px] md:text-xs md:leading-none";
  else if (puzzleSize > 10) textSizeClass = "text-[10px] leading-[10px] md:text-sm md:leading-tight";
  else if (puzzleSize > 5) textSizeClass = "text-xs md:text-sm";

  const containerClass = type === 'row'
    ? `flex flex-row justify-end items-center gap-0.5 md:gap-1.5 pr-1 md:pr-2 h-full font-bold ${textSizeClass} ${textColor} transition-colors duration-300`
    : `flex flex-col justify-end items-center gap-0.5 md:gap-1.5 pb-1 md:pb-2 w-full font-bold ${textSizeClass} ${textColor} transition-colors duration-300`;

  return (
    <div className={containerClass}>
      {hints.map((hint, i) => (
        <span key={i} className={hiddenIndices?.has(i) ? "text-rose-400 dark:text-rose-400" : ""}>
          {hiddenIndices?.has(i) ? '?' : hint}
        </span>
      ))}
    </div>
  );
};

export default Hints;