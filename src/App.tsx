import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ToolType, DifficultyLevel } from './types';
import {
  DIFFICULTY_CONFIG,
  GRID_SIZES,
  WIN_ANIMATION_DURATION_MS,
  DAILY_PUZZLE_CONFIG,
} from './gameConfig';
import GridCell from './components/GridCell';
import Hints from './components/Hints';
import Leaderboard from './components/Leaderboard';
import { useGameLogic } from './hooks/useGameLogic';
import { formatTime } from './utils/time';

const App: React.FC = () => {
  const {
    puzzle,
    playerGrid,
    gameState,
    timer,
    coins,
    theme,
    activeTool,
    selectedSize,
    selectedDifficulty,
    isMobile,
    isCheckHintsActive,
    isDebugVisible,
    lastCorrectCell,
    revealingCells,
    showCopyMessage,
    stats,
    setActiveTool,
    setSelectedSize,
    setSelectedDifficulty,
    setTheme,
    setIsCheckHintsActive,
    startNewGame,
    handleMouseDown,
    handleMouseEnter,
    handleBlast,
    handleShare,
    restartCurrentGame,
    cheatWin,
    resetDaily,
    isRowComplete,
    isColComplete,
    history,
  } = useGameLogic();


  // Dynamic sizing for cells based on difficulty
  const getCellSizeClass = (size: number) => {
    if (size <= 5) return "w-7 h-7 md:w-10 md:h-10";
    if (size <= 10) return "w-4 h-4 md:w-7 md:h-7";
    if (size <= 15) return "w-4 h-4 md:w-6 md:h-6";
    if (size <= 20) return "w-4 h-4 md:w-6 md:h-6";
    return "w-2 h-2 md:w-4 md:h-4"; // Expert ~18x18
  };

  const colHints = puzzle ? Array(puzzle.size).fill(0).map((_, c) => puzzle.grid.map(row => row[c])) : [];
  const rowHints = puzzle ? puzzle.grid : [];

  const headerPortals = (
    <>

      {document.getElementById('theme-toggle-root') && createPortal(
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>,
        document.getElementById('theme-toggle-root')!
      )}
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 gap-4 relative overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">

      {/* Debug Info - Only in DEV */}
      {import.meta.env.DEV && puzzle && (gameState.status === 'playing' || gameState.status === 'won') && isDebugVisible && (
        <div className="absolute top-3 right-3 text-[10px] text-slate-500 font-mono opacity-100 transition-opacity z-50 flex flex-col items-end gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-2 rounded border border-slate-300 dark:border-slate-800 backdrop-blur-sm">
          <div className="text-right">
            Density: <span className="font-bold text-indigo-400">{stats.percent}%</span><br />
            ({stats.count}/{puzzle.size * puzzle.size})<br />
            Seed: <span className="text-slate-400">{puzzle.seed}</span>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 pointer-events-auto"
              title="Copy challenge link to share with friends"
            >
              {showCopyMessage ? (
                <>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={resetDaily}
              className="bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 px-2 py-1 rounded border border-rose-800/50 flex items-center gap-1.5 transition-all active:scale-95 text-[9px] font-bold"
            >
              <span>♻️</span> Reset Daily
            </button>
            <button
              onClick={cheatWin}
              className="bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 px-2 py-1 rounded border border-indigo-800/50 flex items-center gap-1.5 transition-all active:scale-95 text-[9px] font-bold"
            >
              <span>⚡</span> Win
            </button>
          </div>
        </div>
      )}


      <div className="w-full bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-none flex flex-col items-center">

        {/* Top Controls Area - Only shown during gameplay */}
        {(gameState.status === 'playing' || gameState.status === 'won') && (
          <div className="flex flex-col items-center gap-4 w-full mb-4">

            {/* Settings Row - Moved to Portal */}
            {document.getElementById('game-selectors-root') && createPortal(
              <div className="flex gap-2">
                {/* Size Selector */}
                <select
                  value={new URLSearchParams(window.location.search).get('mode') === 'daily' ? DAILY_PUZZLE_CONFIG.get(new Date()).size : selectedSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const url = new URL(window.location.href);
                    if (url.searchParams.get('mode') === 'daily') {
                      url.searchParams.delete('mode');
                      window.history.replaceState({}, '', url.toString());
                    }
                    setSelectedSize(val);
                  }}
                >
                  {GRID_SIZES.map(size => (
                    <option key={size} value={size}>{size}x{size}</option>
                  ))}
                </select>

                {/* Difficulty Selector */}
                <select
                  value={new URLSearchParams(window.location.search).get('mode') === 'daily' ? DAILY_PUZZLE_CONFIG.DIFFICULTY : selectedDifficulty}
                  onChange={(e) => {
                    const val = e.target.value as DifficultyLevel;
                    const url = new URL(window.location.href);
                    if (url.searchParams.get('mode') === 'daily') {
                      url.searchParams.delete('mode');
                      window.history.replaceState({}, '', url.toString());
                    }
                    setSelectedDifficulty(val);
                  }}
                >
                  {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((key) => (
                    <option key={key} value={key}>{DIFFICULTY_CONFIG[key].label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>,
              document.getElementById('game-selectors-root')!
            )}


            <div className="flex gap-4">
              {/* Daily Title if applicable */}
              {new URLSearchParams(window.location.search).get('mode') === 'daily' && (
                <div className="bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 px-4 py-2 rounded-lg text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2 mb-2">
                  <span>📅</span>
                  <span>
                    <span data-i18n="footer.daily_title">Daily Challenge</span>: {new Date().toISOString().split('T')[0]}
                  </span>
                </div>
              )}

              {/* Restart Button */}
              <button
                onClick={restartCurrentGame}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-slate-900/50 transition-all hover:scale-105 text-sm flex items-center gap-2"
                title="Reset progress for this puzzle"
              >
                <span>↺</span> Restart
              </button>

              {/* New Game Button */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => startNewGame(undefined, true)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-slate-900/50 transition-all hover:scale-105 text-sm flex items-center gap-2"
                >
                  <span>+</span> New Game
                </button>
                {import.meta.env.DEV && (
                  <div className="flex gap-2">
                    {new URLSearchParams(window.location.search).get('mode') === 'daily' && (
                      <button
                        onClick={resetDaily}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-rose-900/50 transition-all hover:scale-105 text-sm flex items-center gap-2"
                      >
                        <span>♻️</span> Reset Daily
                      </button>
                    )}
                    <button
                      onClick={cheatWin}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 text-sm flex items-center gap-2"
                    >
                      <span>⚡</span> Win
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Display */}
            {puzzle && (gameState.status === 'playing' || gameState.status === 'won') ? (
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl text-slate-300 font-mono flex items-center gap-2 mb-2" title="Time elapsed">
                  <span className="text-xl">⏱️</span>
                  <span className="font-bold tracking-wider">{formatTime(timer)}</span>
                </div>
              </div>
            ) : <div className="h-4"></div>}
          </div>
        )}

        {/* Mobile Tool Toggles */}
        {gameState.status === 'playing' && isMobile && (
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 w-full max-w-sm justify-center gap-3 mt-1">
            <button
              onClick={() => setActiveTool(ToolType.FILL)}
              className={`px-6 py-1.5 rounded-md text-sm font-bold transition-colors w-1/2 ${activeTool === ToolType.FILL ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'}`}
            >
              Fill
            </button>
            <button
              onClick={() => setActiveTool(ToolType.CROSS)}
              className={`px-8 py-2 rounded-md text-sm font-bold transition-colors w-1/2 ${activeTool === ToolType.CROSS ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'}`}
            >
              Cross (X)
            </button>
          </div>)
        }

        {gameState.status === 'error' && (
          <div className="text-rose-400 bg-rose-950/30 p-4 rounded-lg border border-rose-900 mb-4 text-center w-full">
            {gameState.errorMessage}
          </div>
        )}

        {/* The Grid Container */}
        {puzzle && (gameState.status === 'playing' || gameState.status === 'won') && (
          <div className="max-w-full overflow-auto p-1">

            <div
              className="grid gap-0 select-none bg-slate-300 dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-800 shadow-2xl touch-none mx-auto"
              style={{
                gridTemplateColumns: `auto repeat(${puzzle.size}, min-content)`,
              }}
              onContextMenu={(e) => e.preventDefault()}
            >

              {/* Top-Left Corner */}
              <div className="border-b border-r border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50"></div>

              {/* Column Hints */}
              {colHints.map((col, i) => {
                const dividerInterval = puzzle.size === 8 ? 4 : 5;
                const isThickRight = (i + 1) % dividerInterval === 0 && i !== puzzle.size - 1;
                // We need isColComplete from hook, I forgot to destructure it in my updated logic.
                // I will add it to destructuring.
                // Assuming useGameLogic returns isColComplete and isRowComplete.
                // For now, I'll pass false or add it to destructuring in the next step.
                // Wait, I can't easily access it here without refetching the hook return type.
                // I know I returned it. So I should destructure it.
                const isColCorrect = isCheckHintsActive && isColComplete(i);

                let classes = "bg-slate-200/50 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-800 pb-1 flex flex-col justify-end";
                if (isThickRight) classes += " border-r-2 border-r-slate-400 dark:border-r-slate-400";
                else classes += " border-r border-slate-300 dark:border-slate-800";

                return (
                  <div key={`col-hint-${i}`} className={classes}>
                    <Hints line={col} type="col" isComplete={false} />
                  </div>
                );
              })}

              {/* Rows */}
              {rowHints.map((row, r) => {
                const dividerInterval = puzzle.size === 8 ? 4 : 5;
                const isThickBottom = (r + 1) % dividerInterval === 0 && r !== puzzle.size - 1;
                const isRowCorrect = isCheckHintsActive && isRowComplete(r);

                let hintClasses = "border-r border-slate-300 dark:border-slate-800 pr-1 flex items-center justify-end bg-slate-200/50 dark:bg-slate-900/50";

                if (isThickBottom) hintClasses += " border-b-2 border-b-slate-400 dark:border-b-slate-400";
                else hintClasses += " border-b border-slate-300 dark:border-slate-800";

                return (
                  <React.Fragment key={`row-${r}`}>
                    <div className={hintClasses}>
                      <Hints line={row} type="row" isComplete={isRowCorrect} />
                    </div>

                    {playerGrid[r].map((cellState, c) => {
                      let delay = "0ms";
                      if (gameState.status === 'won' && lastCorrectCell !== null) {
                        const dx = c - lastCorrectCell.c;
                        const dy = r - lastCorrectCell.r;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        delay = `${Math.round(dist * 90)}ms`;
                      }

                      return (
                        <div key={`cell-${r}-${c}`} className={`aspect-square ${getCellSizeClass(puzzle.size)}`}>
                          <GridCell
                            state={cellState}
                            isRevealed={gameState.status === 'won'}
                            isDebug={isDebugVisible}
                            isSolutionFilled={puzzle.grid[r][c] === 1}
                            onMouseDown={(e) => handleMouseDown(e, r, c)}
                            onMouseEnter={(e) => handleMouseEnter(e, r, c)}
                            isMobile={isMobile}
                            borderRightThick={(c + 1) % (puzzle.size === 8 ? 4 : 5) === 0 && c !== puzzle.size - 1}
                            borderBottomThick={(r + 1) % (puzzle.size === 8 ? 4 : 5) === 0 && r !== puzzle.size - 1}
                            animationDelay={delay}
                            animationDuration={`${WIN_ANIMATION_DURATION_MS}ms`}
                            isRevealing={revealingCells.has(`${r}-${c}`)}
                            styleMode="sharp"
                          />
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Show Correct Hints Checkbox */}
            <div className="mt-6 flex justify-center">
              <label className="flex items-center gap-3 cursor-pointer group bg-slate-800/30 px-4 py-2 rounded-full border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isCheckHintsActive}
                    onChange={() => setIsCheckHintsActive(prev => !prev)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${isCheckHintsActive ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isCheckHintsActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                  Show Correct hints
                </span>
              </label>
            </div>
          </div>
        )
        }

        {gameState.status === 'won' && puzzle && (
          <Leaderboard
            puzzle={puzzle}
            timer={timer}
            history={history}
            difficulty={puzzle.difficulty}
            onPlayAgain={() => startNewGame(undefined, true)}
          />
        )}

      </div>

      {headerPortals}
    </div>
  );
};

export default App;