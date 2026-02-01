import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generatePuzzle } from './services/geminiService';
import { CellState, GameState, PuzzleData, ToolType, DifficultyLevel } from './types';
import {
  DIFFICULTY_CONFIG,
  GRID_SIZES,
  WIN_ANIMATION_DURATION_MS,
  META_LAYER_MAP_IMAGES_COUNT,
  BLAST_REVEAL_DELAY_MS,
  INITIAL_COINS,
  BLAST_COST,
} from './gameConfig';
import GridCell from './components/GridCell';
import Hints from './components/Hints';
import { INITIAL_GRIND_STATE, completeLevel } from './grind';

// Helper to create empty grid
const createEmptyGrid = (size: number): CellState[][] =>
  Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));

// Helper to convert string seed to integer
const stringToSeed = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const App: React.FC = () => {
  // Game State
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>([]);
  const [gameState, setGameState] = useState<GameState>({ status: 'loading' });
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
  const [isCheckHintsActive, setIsCheckHintsActive] = useState<boolean>(false);
  const [winCorner, setWinCorner] = useState<number | null>(null); // 0:TL, 1:TR, 2:BL, 3:BR
  const [lastCorrectCell, setLastCorrectCell] = useState<{ r: number, c: number } | null>(null); // Track last correctly placed cell

  const [grindState, setGrindState] = useState(INITIAL_GRIND_STATE); // Grind system state
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
  const [revealingCells, setRevealingCells] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(INITIAL_COINS); // Track available coins
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('nomo7-theme') as 'dark' | 'light') || 'dark';
  }); // Theme state
  const [winAnimationMode, setWinAnimationMode] = useState<'smooth' | 'sharp'>('smooth'); // Animation style toggle



  // Controls
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.FILL);

  // Settings
  const [selectedSize, setSelectedSize] = useState<number>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Dragging State
  const isDragging = useRef<boolean>(false);
  const dragTargetState = useRef<CellState | null>(null);

  // Apply theme class to html element and save to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nomo7-theme', theme);
  }, [theme]);

  // Check viewport for mobile helper
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global MouseUp to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
      dragTargetState.current = null;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Initialize a default game or start fresh
  const startNewGame = useCallback(async (seedVal?: string) => {
    setGameState({ status: 'loading' });
    setIsDebugVisible(false); // Reset debug on new game
    setIsCheckHintsActive(false); // Reset hint checking
    setWinCorner(null); // Reset win animation
    setLastCorrectCell(null); // Reset last correct cell tracking
    try {
      let finalSeed: number;
      if (seedVal && seedVal.trim().length > 0) {
        if (/^\d+$/.test(seedVal)) {
          finalSeed = parseInt(seedVal, 10);
        } else {
          finalSeed = stringToSeed(seedVal);
        }
      } else {
        finalSeed = Math.floor(Math.random() * 2000000000);
      }

      const diffConfig = DIFFICULTY_CONFIG[selectedDifficulty];
      const newPuzzle = await generatePuzzle(finalSeed, selectedSize, diffConfig);

      setPuzzle(newPuzzle);
      setPlayerGrid(createEmptyGrid(newPuzzle.size));
      setGameState({ status: 'playing' });
    } catch (e) {
      setGameState({ status: 'error', errorMessage: 'Failed to generate puzzle.' });
    }
  }, [selectedSize, selectedDifficulty]);



  // Update unlocked markers when a game is won
  useEffect(() => {
    if (gameState.status === 'won' && puzzle) {
      // Update grind state
      setGrindState(prev => completeLevel(prev));
    }
  }, [gameState.status, puzzle]);

  // Check for win condition
  useEffect(() => {
    if (gameState.status !== 'playing' || !puzzle) return;

    let isWin = true;

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const target = puzzle.grid[r][c];
        const current = playerGrid[r][c];

        // Check if this cell is incorrect (breaks win condition)
        if (target === 1 && current !== CellState.FILLED) {
          isWin = false;
          break;
        }
        if (target === 0 && current === CellState.FILLED) {
          isWin = false;
          break;
        }
      }
      if (!isWin) break;
    }

    if (isWin) {
      setGameState({ status: 'won' });
      setIsDebugVisible(false); // Ensure debug is off so we see the official win state colors
      setIsCheckHintsActive(true); // Reveal all green hints on win
    }
  }, [playerGrid, puzzle, gameState.status]);

  // Helper to update a single cell safely
  const updateCell = useCallback((r: number, c: number, newState: CellState) => {
    setPlayerGrid(prev => {
      if (prev[r][c] === newState) return prev;
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = newState;

      // Track the last cell that was changed
      if (puzzle && gameState.status === 'playing') {
        const target = puzzle.grid[r][c];
        // If this cell is now correct, update lastCorrectCell
        if ((target === 1 && newState === CellState.FILLED) ||
          (target === 0 && newState !== CellState.FILLED)) {
          setLastCorrectCell({ r, c });
        }
      }

      return newGrid;
    });
  }, [puzzle, gameState.status]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (gameState.status !== 'playing') return;

    let tool = activeTool;
    if (e.button === 2) {
      tool = ToolType.CROSS;
    }

    const currentCell = playerGrid[r][c];
    let targetState = CellState.EMPTY;

    if (tool === ToolType.FILL) {
      if (currentCell === CellState.FILLED) targetState = CellState.EMPTY;
      else targetState = CellState.FILLED;
    } else {
      if (currentCell === CellState.CROSSED) targetState = CellState.EMPTY;
      else targetState = CellState.CROSSED;
    }

    isDragging.current = true;
    dragTargetState.current = targetState;
    updateCell(r, c, targetState);
  };

  const handleMouseEnter = (e: React.MouseEvent, r: number, c: number) => {
    if (gameState.status !== 'playing') return;
    if (!isDragging.current || dragTargetState.current === null) return;

    updateCell(r, c, dragTargetState.current);
  };

  // Toggle debug visibility
  const handleDebugToggle = () => {
    setIsDebugVisible(prev => !prev);
  };

  // Toggle hints check
  const handleCheckHintsToggle = () => {
    setIsCheckHintsActive(prev => !prev);
  };

  // Instant Win Cheat
  const handleCheatWin = () => {
    if (!puzzle) return;
    const solvedGrid = puzzle.grid.map(row =>
      row.map(val => val === 1 ? CellState.FILLED : CellState.EMPTY)
    );
    setPlayerGrid(solvedGrid);
    // Set last correct cell to center for cheat win
    setLastCorrectCell({ r: Math.floor(puzzle.size / 2), c: Math.floor(puzzle.size / 2) });
    // Set game state to won
    setGameState({ status: 'won' });
    setIsDebugVisible(false);
    setIsCheckHintsActive(true);
  };

  // Blast Booster - Reveal 3 random cells
  const handleBlast = useCallback(() => {
    if (coins < BLAST_COST || !puzzle || !playerGrid.length || gameState.status !== 'playing') return;

    const emptyCells: { r: number, c: number }[] = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (playerGrid[r][c] === CellState.EMPTY) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length < 3) {
      // Optional: could add toast/alert, but silent for now
      return;
    }

    // Fisher-Yates shuffle
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }

    const toReveal = emptyCells.slice(0, 3);

    toReveal.forEach((cell, index) => {
      setTimeout(() => {
        const target = puzzle.grid[cell.r][cell.c];
        const newState = target === 1 ? CellState.FILLED : CellState.CROSSED;
        setRevealingCells(prev => {
          const next = new Set(prev);
          next.add(`${cell.r}-${cell.c}`);
          return next;
        });
        updateCell(cell.r, cell.c, newState);
        setTimeout(() => {
          setRevealingCells(prev => {
            const next = new Set(prev);
            next.delete(`${cell.r}-${cell.c}`);
            return next;
          });
        }, BLAST_REVEAL_DELAY_MS * index + 700);  // anim 600ms + buffer
      }, index * BLAST_REVEAL_DELAY_MS);
    });

    // Spend coins for blast
    setCoins(prev => prev - BLAST_COST);
  }, [puzzle, playerGrid, gameState.status, updateCell, coins]);

  // Add Coins Cheat
  const handleAddCoins = () => {
    setCoins(prev => prev + 10);
  };

  // Get count of empty cells - used for blast button disabled state
  const getEmptyCellCount = useCallback(() => {
    if (!playerGrid.length) return 0;
    return playerGrid.flat().filter(state => state === CellState.EMPTY).length;
  }, [playerGrid]);

  // Generate Hints
  const colHints = puzzle ? Array(puzzle.size).fill(0).map((_, c) => puzzle.grid.map(row => row[c])) : [];
  const rowHints = puzzle ? puzzle.grid : [];

  // Logic to check if a specific row or column is correctly solved
  const isRowComplete = (rowIndex: number): boolean => {
    if (!puzzle || !playerGrid.length) return false;
    // Check if player grid row matches puzzle row
    // Logic: If puzzle is 1, player must be FILLED. If puzzle is 0, player must NOT be FILLED.
    for (let c = 0; c < puzzle.size; c++) {
      const target = puzzle.grid[rowIndex][c];
      const current = playerGrid[rowIndex][c];
      if (target === 1 && current !== CellState.FILLED) return false;
      if (target === 0 && current === CellState.FILLED) return false;
    }
    return true;
  };

  const isColComplete = (colIndex: number): boolean => {
    if (!puzzle || !playerGrid.length) return false;
    for (let r = 0; r < puzzle.size; r++) {
      const target = puzzle.grid[r][colIndex];
      const current = playerGrid[r][colIndex];
      if (target === 1 && current !== CellState.FILLED) return false;
      if (target === 0 && current === CellState.FILLED) return false;
    }
    return true;
  };

  // Dynamic sizing for cells based on difficulty
  const getCellSizeClass = (size: number) => {
    if (size <= 5) return "w-7 h-7 md:w-10 md:h-10";
    if (size <= 10) return "w-4 h-4 md:w-7 md:h-7";
    if (size <= 15) return "w-4 h-4 md:w-6 md:h-6";
    if (size <= 20) return "w-4 h-4 md:w-6 md:h-6";
    // if (size <= 20) return "w-3 h-3 md:w-4 md:h-4";
    return "w-2 h-2 md:w-4 md:h-4"; // Expert ~18x18
  };

  // Stats calculation
  const getStats = () => {
    if (!puzzle) return { count: 0, percent: 0 };
    let filledCount = 0;
    puzzle.grid.forEach(row => row.forEach(val => filledCount += val));
    const total = puzzle.size * puzzle.size;
    return {
      count: filledCount,
      percent: ((filledCount / total) * 100).toFixed(1)
    };
  };

  const stats = getStats();

  // Auto-start or restart game when settings change
  useEffect(() => {
    startNewGame();
  }, [selectedSize, selectedDifficulty, startNewGame]);

  // Initial start removed as we now have the effect above or want to show map?
  // Previous user request was for Map first. 
  // If Map is shown (status: 'idle'), we maybe SHOULDN'T start a game automatically.
  // But if they CHANGE settings, they probably want to play.
  // Let's stick to: if playing/won -> restart. If idle -> just update state.

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 gap-4 relative overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/50 via-slate-100 to-slate-100 dark:from-indigo-900/20 dark:via-slate-900 dark:to-slate-900 -z-10"></div>


      <div className="w-full bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-none flex flex-col items-center">

        {/* Top Controls Area - Only shown during gameplay */}
        {(gameState.status === 'playing' || gameState.status === 'won') && (
          <div className="flex flex-col items-center gap-4 w-full mb-4">

            {/* Settings Row - Moved to Portal */}
            {document.getElementById('game-selectors-root') && createPortal(
              <div className="flex gap-3">
                {/* Size Selector */}
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                >
                  {GRID_SIZES.map(size => (
                    <option key={size} value={size}>{size}x{size}</option>
                  ))}
                </select>

                {/* Difficulty Selector */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                >
                  {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((key) => (
                    <option key={key} value={key}>{DIFFICULTY_CONFIG[key].label.split(' ')[0]}</option>
                  ))}
                </select>
              </div>,
              document.getElementById('game-selectors-root')!
            )}


            {/* New Game Button */}
            <button
              onClick={() => startNewGame()}
              className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-slate-900/50 transition-all hover:scale-105 text-sm"
            >
              New Game
            </button>

            {/* Seed Display & Debug */}
            {puzzle && (gameState.status === 'playing' || gameState.status === 'won') ? (
              <div className="flex flex-col items-center gap-1">

                <div className="text-xs text-slate-500 font-mono" title="Puzzle density">
                  Density: <span className="font-bold text-indigo-400">{stats.percent}%</span> ({stats.count}/{puzzle.size * puzzle.size} cells)
                </div>


                <div className="text-xs text-slate-500 font-mono" title="Available coins for boosters">
                  Coins: <span className="font-bold text-amber-400">{coins}</span> 💰
                </div>


                <div className="flex gap-2">
                  <button
                    onClick={handleDebugToggle}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    {isDebugVisible ? 'Hide' : 'Show'} Solution
                  </button>


                  <button
                    onClick={handleCheckHintsToggle}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    {isCheckHintsActive ? 'Hide' : 'Check'} Hints
                  </button>


                  <button
                    onClick={handleCheatWin}
                    className="px-2 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-amber-200 rounded transition-colors"
                  >
                    Cheat Win
                  </button>

                  <button
                    onClick={handleBlast}
                    disabled={coins < BLAST_COST || getEmptyCellCount() < 3}
                    className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-blue-100 rounded transition-all"
                    title={`💥 Reveal 3 random empty cells for ${BLAST_COST} coins`}
                  >
                    💥 Blast ({BLAST_COST})
                  </button>

                  <button
                    onClick={handleAddCoins}
                    className="px-2 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-amber-200 rounded transition-colors shadow-sm"
                    title="💰 Cheat: Add 10 coins"
                  >
                    +10 💰
                  </button>
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

        {/* The Grid Container - Responsive scrolling for very large grids on small screens if needed, though we try to fit */}
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
                const isColCorrect = isCheckHintsActive && isColComplete(i);

                let classes = "bg-slate-200/50 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-800 pb-1 flex flex-col justify-end";
                if (isThickRight) classes += " border-r-2 border-r-slate-400 dark:border-r-slate-400";
                else classes += " border-r border-slate-300 dark:border-slate-800";

                return (
                  <div key={`col-hint-${i}`} className={classes}>
                    <Hints line={col} type="col" isComplete={isColCorrect} />
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
                      // Calculate animation delay for wave effect
                      let delay = "0ms";
                      if (gameState.status === 'won' && lastCorrectCell !== null) {
                        // Calculate Euclidean distance from last correct cell for circular wave effect
                        const dx = c - lastCorrectCell.c;
                        const dy = r - lastCorrectCell.r;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        // 30ms per unit distance for smoother animation
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
          </div>
        )}

        {/* {gameState.status === 'won' && puzzle && (
          <div className="mt-8 text-center animate-bounce">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h2>
            <p className="text-slate-300">It was: <span className="text-indigo-400 font-bold text-lg uppercase">{puzzle.title}</span></p>
            <button
              onClick={() => startNewGame(inputSeed)}
              className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-emerald-900/50 transition-all hover:scale-105 text-lg"
            >
              🎉 Play Another
            </button>
          </div>
        )} */}



      </div>

      {document.getElementById('theme-toggle-root') && createPortal(
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 shadow-md transform hover:scale-110 active:scale-95 border border-slate-300 dark:border-slate-500"
          title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
          <span className="text-xl leading-none">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
        </button>,
        document.getElementById('theme-toggle-root')!
      )}
    </div>
  );
};

export default App;