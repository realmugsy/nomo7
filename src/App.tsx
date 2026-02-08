import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { generatePuzzle } from './services/geminiService';
import { CellState, GameState, PuzzleData, ToolType, DifficultyLevel, RecordData } from './types';
import { getPuzzleId, saveRecord, getTopRecords } from './services/recordsService';
import {
  DIFFICULTY_CONFIG,
  GRID_SIZES,
  WIN_ANIMATION_DURATION_MS,
  META_LAYER_MAP_IMAGES_COUNT,
  BLAST_REVEAL_DELAY_MS,
  INITIAL_COINS,
  BLAST_COST,
  DAILY_PUZZLE_CONFIG,
} from './gameConfig';
import GridCell from './components/GridCell';
import Hints from './components/Hints';
import { INITIAL_GRIND_STATE, completeLevel } from './grind';

// Helper to create empty grid
const createEmptyGrid = (size: number): CellState[][] =>
  Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));

// Helper to convert string seed to integer
// Helper to get deterministic daily seed (YYYYMMDD)
const getDailySeed = (): number => {
  const d = new Date();
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(d.getUTCDate()).padStart(2, '0');
  return parseInt(`${YYYY}${MM}${DD}`, 10);
};

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

const DIFFICULTY_LEVELS: DifficultyLevel[] = ['VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'];

// --- Challenge Token Logic ---
const encodeChallenge = (seed: number, size: number, difficulty: DifficultyLevel): string => {
  const diffIdx = DIFFICULTY_LEVELS.indexOf(difficulty);
  const raw = `${size}:${diffIdx}:${seed}`;
  // Simple obfuscation (Base64 + swapping some chars)
  const b64 = btoa(raw).replace(/=/g, '');
  return b64.split('').reverse().join('');
};

const decodeChallenge = (token: string): { seed: number, size: number, difficulty: DifficultyLevel } | null => {
  try {
    let b64 = token.split('').reverse().join('');
    // Restore padding
    while (b64.length % 4 !== 0) b64 += '=';
    const raw = atob(b64);
    const [sizeStr, diffIdxStr, seedStr] = raw.split(':');
    const size = parseInt(sizeStr, 10);
    const diffIdx = parseInt(diffIdxStr, 10);
    const seed = parseInt(seedStr, 10);
    const difficulty = DIFFICULTY_LEVELS[diffIdx];

    if (isNaN(size) || isNaN(seed) || !difficulty) return null;
    return { size, seed, difficulty };
  } catch {
    return null;
  }
};

const getChallengeFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const c = params.get('c');
  return c ? decodeChallenge(c) : null;
};

const App: React.FC = () => {
  // Challenge Loading (Synchronous on mount)
  const challengeData = useRef(getChallengeFromUrl());

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
  const [timer, setTimer] = useState<number>(0); // Gameplay timer in seconds



  // Controls
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.FILL);

  // Settings
  const [selectedSize, setSelectedSize] = useState<number>(() => {
    if (challengeData.current) return challengeData.current.size;
    const params = new URLSearchParams(window.location.search);
    const size = parseInt(params.get('size') || '', 10);
    return !isNaN(size) ? size : 10;
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(() => {
    if (challengeData.current) return challengeData.current.difficulty;
    const params = new URLSearchParams(window.location.search);
    const diff = params.get('difficulty') as DifficultyLevel;
    return (diff && DIFFICULTY_LEVELS.includes(diff)) ? diff : 'MEDIUM';
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showCopyMessage, setShowCopyMessage] = useState<boolean>(false);

  // Dragging State
  const isDragging = useRef<boolean>(false);
  const dragTargetState = useRef<CellState | null>(null);

  // Leaderboard State
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('nomo7-player-name') || '');
  const [topRecords, setTopRecords] = useState<RecordData[]>([]);
  const [isRecordSubmitted, setIsRecordSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch top records when game is won
  useEffect(() => {
    if (gameState.status === 'won' && puzzle) {
      const pid = getPuzzleId(puzzle.size, selectedDifficulty, puzzle.seed);
      getTopRecords(pid).then(records => setTopRecords(records));
      setIsRecordSubmitted(false); // Reset for new win
    }
  }, [gameState.status, puzzle, selectedDifficulty]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puzzle || !playerName.trim() || isRecordSubmitted) return;

    setIsSubmitting(true);
    localStorage.setItem('nomo7-player-name', playerName); // Save name

    const pid = getPuzzleId(puzzle.size, selectedDifficulty, puzzle.seed);
    const result = await saveRecord(pid, playerName, timer * 1000);

    if (result.ok) {
      setIsRecordSubmitted(true);
      // Refresh top records
      const records = await getTopRecords(pid);
      setTopRecords(records);
    } else {
      alert('Failed to save record: ' + (result.error || 'Unknown error'));
    }
    setIsSubmitting(false);
  };

  // Timer Effect
  useEffect(() => {
    let interval: number | undefined;
    if (gameState.status === 'playing') {
      interval = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.status]);

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
  const startNewGame = useCallback(async (seedVal?: string, forceRandom: boolean = false) => {
    setGameState({ status: 'loading' });
    setTimer(0); // Reset timer
    setIsDebugVisible(false); // Reset debug on new game
    setIsCheckHintsActive(false); // Reset hint checking
    setWinCorner(null); // Reset win animation
    setLastCorrectCell(null); // Reset last correct cell tracking

    // Direct Access Prevention: If daily already solved, redirect to normal random game
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'daily') {
      const today = new Date().getUTCFullYear() + '-' + (new Date().getUTCMonth() + 1) + '-' + new Date().getUTCDate();
      if (localStorage.getItem('lastDailySolved') === today) {
        params.delete('mode');
        window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
        // Continue but it won't be in daily mode anymore
      }
    }

    try {
      let finalSeed: number;

      // Priority 1: Direct seed input (dev/debug)
      if (seedVal && seedVal.trim().length > 0) {
        if (/^\d+$/.test(seedVal)) {
          finalSeed = parseInt(seedVal, 10);
        } else {
          finalSeed = stringToSeed(seedVal);
        }
      }
      // Priority 2: Daily mode (Deterministic)
      else if (new URLSearchParams(window.location.search).get('mode') === 'daily') {
        finalSeed = getDailySeed();
      }
      // Priority 3: Use challenge info from URL if available and NOT force-starting a new random game
      else if (challengeData.current && !forceRandom) {
        finalSeed = challengeData.current.seed;
      }
      // Priority 4: Random seed
      else {
        finalSeed = Math.floor(Math.random() * 2000000000);

        // If we are starting a random game, clear the challenge from URL/state
        if (typeof window !== 'undefined' && challengeData.current) {
          const url = new URL(window.location.href);
          if (url.searchParams.has('c')) {
            url.searchParams.delete('c');
            window.history.replaceState({}, '', url.toString());
          }
          challengeData.current = null;
        }
      }

      const isDaily = new URLSearchParams(window.location.search).get('mode') === 'daily';
      const finalSize = isDaily ? DAILY_PUZZLE_CONFIG.SIZE : selectedSize;
      const finalDiff: DifficultyLevel = isDaily ? DAILY_PUZZLE_CONFIG.DIFFICULTY : selectedDifficulty;

      const diffConfig = DIFFICULTY_CONFIG[finalDiff];
      const newPuzzle = await generatePuzzle(finalSeed, finalSize, diffConfig);

      setPuzzle(newPuzzle);
      setPlayerGrid(createEmptyGrid(newPuzzle.size));
      setGameState({ status: 'playing' });
    } catch (e) {
      setGameState({ status: 'error', errorMessage: 'Failed to generate puzzle.' });
    }
  }, [selectedSize, selectedDifficulty]);



  // Update unlocked markers and award daily coins when a game is won
  useEffect(() => {
    if (gameState.status === 'won' && puzzle) {
      // Update grind state
      setGrindState(prev => completeLevel(prev));

      // Handle daily奖励
      const isDaily = new URLSearchParams(window.location.search).get('mode') === 'daily';
      if (isDaily) {
        const today = new Date().getUTCFullYear() + '-' + (new Date().getUTCMonth() + 1) + '-' + new Date().getUTCDate();
        const lastDaily = localStorage.getItem('lastDailySolved');
        if (lastDaily !== today) {
          setCoins(prev => prev + 50);
          localStorage.setItem('lastDailySolved', today);
          // Optional: we can show a special message or sound here later
        }
      }
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

  // Reset Daily Cheat (For Debug/Testing)
  const handleResetDaily = () => {
    localStorage.removeItem('lastDailySolved');
    // Refresh to update UI (layout.js and App.tsx checks)
    window.location.reload();
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

  // Helper to format time
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num: number) => num < 10 ? `0${num}` : num;

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const restartCurrentGame = useCallback(() => {
    if (!puzzle) return;
    setPlayerGrid(createEmptyGrid(puzzle.size));
    setTimer(0);
    setGameState({ status: 'playing' });
    setWinCorner(null);
    setLastCorrectCell(null);
  }, [puzzle]);

  // Share current puzzle
  const handleShare = () => {
    if (!puzzle) return;
    const token = encodeChallenge(puzzle.seed, puzzle.size, selectedDifficulty);
    const url = new URL(window.location.href);
    url.searchParams.set('c', token);

    navigator.clipboard.writeText(url.toString()).then(() => {
      setShowCopyMessage(true);
      setTimeout(() => setShowCopyMessage(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-2 gap-4 relative overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">

      {/* Debug Info: Density and Seed shifted to top-right corner */}
      {puzzle && (gameState.status === 'playing' || gameState.status === 'won') && isDebugVisible && (
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
              onClick={handleResetDaily}
              className="bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 px-2 py-1 rounded border border-rose-800/50 flex items-center gap-1.5 transition-all active:scale-95 text-[9px] font-bold"
            >
              <span>♻️</span> Reset Daily
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
                  value={new URLSearchParams(window.location.search).get('mode') === 'daily' ? DAILY_PUZZLE_CONFIG.SIZE : selectedSize}
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
                    <span data-i18n="footer.daily_title">Daily Challenge</span>: {new Date().toLocaleDateString()}
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

              {/* New Game Button with Hidden Debug Trigger */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => startNewGame(undefined, true)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-slate-900/50 transition-all hover:scale-105 text-sm flex items-center gap-2"
                >
                  <span>+</span> New Game
                </button>


              </div>
            </div>

            {/* Seed Display & Debug */}
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

            {/* Show Correct Hints Checkbox - Moved below the grid */}
            <div className="mt-6 flex justify-center">
              <label className="flex items-center gap-3 cursor-pointer group bg-slate-800/30 px-4 py-2 rounded-full border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isCheckHintsActive}
                    onChange={handleCheckHintsToggle}
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
          <div className="mt-8 text-center animate-bounce-in w-full max-w-md">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h2>
            <p className="text-slate-300 mb-4">It was: <span className="text-indigo-400 font-bold text-lg uppercase">{puzzle.title}</span></p>

            {/* Leaderboard Section */}
            <div className="bg-slate-200 dark:bg-slate-900/80 rounded-lg p-4 mb-4 text-left border border-slate-300 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-400 dark:border-slate-700 pb-1">Leaderboard</h3>

              {!isRecordSubmitted ? (
                <form onSubmit={handleRecordSubmit} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm"
                    maxLength={24}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : 'Save'}
                  </button>
                </form>
              ) : (
                <div className="text-center text-emerald-500 font-bold mb-4 text-sm bg-emerald-900/20 py-1 rounded border border-emerald-900/30">
                  ✨ Record Saved!
                </div>
              )}

              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {topRecords.length > 0 ? (
                  topRecords.map((rec, idx) => (
                    <div key={idx} className={`flex justify-between text-sm p-1 rounded ${rec.playerName === playerName && isRecordSubmitted && rec.timeMs === timer * 1000 ? 'bg-indigo-100 dark:bg-indigo-900/30 font-bold border border-indigo-200 dark:border-indigo-800' : 'odd:bg-slate-100 dark:odd:bg-slate-800/50'}`}>
                      <span className="truncate max-w-[120px]">{idx + 1}. {rec.playerName}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{formatTime(Math.floor(rec.timeMs / 1000))}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 text-xs py-2">No records yet. Be the first!</div>
                )}
              </div>
            </div>

            <button
              onClick={() => startNewGame(undefined, true)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-900/50 transition-all hover:scale-105"
            >
              🎉 Play Another
            </button>
          </div>
        )}



      </div>

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
    </div>
  );
};

export default App;