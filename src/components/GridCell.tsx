import React from 'react';
import { CellState } from '../types';
import { MARKER_BORDER_WIDTH, MARKER_BORDER_COLOR, FILLED_CELL_BORDER_WIDTH, FILLED_CELL_BORDER_COLOR, CROSS_MARKER_SIZE, VICTORY_ANIMATION_BORDER_WIDTH, VICTORY_ANIMATION_BORDER_COLOR, FILLED_CELL_MARKER_REDUCTION_PX } from '../gameConfig';

interface GridCellProps {
  state: CellState;
  isRevealed: boolean; // For showing the solution at the end (Game Over)
  isDebug: boolean;    // For temporarily revealing the solution (Debug Toggle)
  isSolutionFilled: boolean; // True if the cell SHOULD be filled (for reveal)
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  isMobile: boolean;
  borderRightThick?: boolean;
  borderBottomThick?: boolean;
  animationDelay?: string;
  animationDuration?: string;
  isRevealing?: boolean;  // NEW: for blast reveal effect
  styleMode?: 'smooth' | 'sharp'; // NEW: animation style
}

const GridCell: React.FC<GridCellProps> = ({
  state,
  isRevealed,
  isDebug,
  isSolutionFilled,
  onMouseDown,
  onMouseEnter,
  isMobile,
  borderRightThick,
  borderBottomThick,
  animationDelay,
  animationDuration,
  isRevealing,
  styleMode = 'smooth'
}) => {

  // Base classes
  let classes = "w-full h-full border-b border-r border-slate-300 dark:border-slate-700 transition-all duration-100 cursor-pointer flex items-center justify-center box-border select-none";

  // Thick borders for visual separation of 5x5 blocks
  if (borderRightThick) classes += " border-r-2 border-r-slate-400 dark:border-r-slate-400";
  if (borderBottomThick) classes += " border-b-2 border-b-slate-400 dark:border-b-slate-400";

  // Determine if we should show the "Truth" (solution)
  // We show truth if game is won (isRevealed) OR if debug mode is active
  const showSolution = isRevealed || isDebug;

  // Custom style for animation
  const style: React.CSSProperties = {};
  if (isRevealed && isSolutionFilled) {
    if (animationDelay) style.animationDelay = animationDelay;
    if (animationDuration) style.animationDuration = animationDuration;
  }
  // Add relative positioning for absolute markers
  style.position = 'relative';

  // State styling
  if (showSolution) {
    if (isSolutionFilled) {
      // Correctly filled cell (Solution)

      if (isRevealed && !isDebug) {
        // Game Won Animation:
        // Keep background transparent, only animate the marker (inner div)
        // No special classes for outer container needed
      } else if (isDebug) {
        // Debug view or standard revealed state without animation requirements
        classes += " bg-emerald-500 border-emerald-600";
      } else {
        // For other cases, keep the background
        classes += " bg-indigo-500";
      }
    } else {
      // Empty cell (Solution)
      classes += " bg-slate-200 dark:bg-slate-800";

      // Error highlight: Only show RED if it's the actual End Game reveal and the user made a mistake.
      // We do NOT show red in Debug/Peek mode.
      if (isRevealed && state === CellState.FILLED) {
        classes += " bg-red-500/50";
      }
    }
  } else {
    // Normal Playing State
    if (state === CellState.FILLED) {
      // Remove background color since we're using a separate marker
      classes += " hover:bg-slate-300 dark:hover:bg-slate-700";
      // Add custom style for border
      style.border = `${FILLED_CELL_BORDER_WIDTH}px solid ${FILLED_CELL_BORDER_COLOR}`;
    } else if (state === CellState.CROSSED) {
      classes += " bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500";
    } else {
      classes += " bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700";
    }
  }

  // Add reveal effect classes
  if (isRevealing) {
    classes += ' animate-blast-reveal relative z-20 shadow-2xl border-blue-400';
    style.zIndex = 20;
    style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
  }

  return (
    <div
      className={classes}
      style={style}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu to allow Right Click usage
      role="button"
      aria-label="Grid cell"
    >
      {/* Show filled cell marker when filled and not in solution mode */}
      {state === CellState.FILLED && !showSolution && (
        <div
          className="absolute bg-indigo-500 rounded-sm animate-cell-pop shadow-lg shadow-indigo-500/20"
          style={{
            top: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            left: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            right: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            bottom: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
          }}
        />
      )}

      {/* Show victory animation marker when in solution mode and cell is filled */}
      {isSolutionFilled && isRevealed && !isDebug && (
        <div
          className={`absolute bg-indigo-500 rounded-sm ${styleMode === 'sharp' ? 'animate-win-step' : 'animate-win-pulse'}`}
          style={{
            top: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            left: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            right: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            bottom: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            border: `${VICTORY_ANIMATION_BORDER_WIDTH}px solid ${VICTORY_ANIMATION_BORDER_COLOR}`,
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration
          }}
        />
      )}

      {/* Show solution marker in debug mode */}
      {isSolutionFilled && isDebug && !isRevealed && (
        <div
          className="absolute bg-emerald-500 rounded-sm"
          style={{
            top: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            left: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            right: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            bottom: `${FILLED_CELL_MARKER_REDUCTION_PX}px`,
            border: '1px solid #059669' // Emerald-600
          }}
        />
      )}

      {/* Show Cross only if it's NOT revealed/debug (unless we want to see crosses on empty cells? No, usually solution cleans up) */}
      {state === CellState.CROSSED && !showSolution && (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${CROSS_MARKER_SIZE} pointer-events-none animate-cross-pop`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={MARKER_BORDER_WIDTH}
            stroke={MARKER_BORDER_COLOR}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
};

export default React.memo(GridCell);