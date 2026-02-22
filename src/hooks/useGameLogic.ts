import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle } from '../services/geminiService';
import { CellState, GameState, PuzzleData, ToolType, DifficultyLevel, Move, GameMode } from '../types';
import {
    DIFFICULTY_CONFIG,
    GRID_SIZES,
    BLAST_REVEAL_DELAY_MS,
    INITIAL_COINS,
    BLAST_COST,
    DAILY_PUZZLE_CONFIG,
    SURVIVAL_LIVES,
    DEFAULT_MYSTERY_HINTS_COUNT,
    ERROR_FLASH_DURATION_MS,
} from '../gameConfig';
import validSeeds from '../data/valid_seeds.json';
import { INITIAL_GRIND_STATE, completeLevel } from '../grind';

// Helper to create empty grid
const createEmptyGrid = (size: number): CellState[][] =>
    Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));

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

const getHintCountForLine = (line: number[]) => {
    let count = 0;
    let current = 0;
    for (const cell of line) {
        if (cell === 1) {
            current++;
        } else if (current > 0) {
            count++;
            current = 0;
        }
    }
    if (current > 0) count++;
    return count === 0 ? 1 : count; // 0 hints returns [0] which is length 1.
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

export const useGameLogic = () => {
    // Challenge Loading (Synchronous on mount)
    const challengeData = useRef(getChallengeFromUrl());

    // Game State
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [playerGrid, setPlayerGrid] = useState<CellState[][]>([]);
    const [gameState, setGameState] = useState<GameState>({ status: 'loading' });
    const [gameMode, setGameMode] = useState<GameMode>('classic');
    const [lives, setLives] = useState<number>(SURVIVAL_LIVES);
    const [mysteryHintsCount, setMysteryHintsCount] = useState<number>(DEFAULT_MYSTERY_HINTS_COUNT);
    const [hiddenHintsMap, setHiddenHintsMap] = useState<Record<string, Set<number>>>({});
    const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
    const [isCheckHintsActive, setIsCheckHintsActive] = useState<boolean>(false);
    const [winCorner, setWinCorner] = useState<number | null>(null); // 0:TL, 1:TR, 2:BL, 3:BR
    const [lastCorrectCell, setLastCorrectCell] = useState<{ r: number, c: number } | null>(null); // Track last correctly placed cell
    const [isErrorFlashing, setIsErrorFlashing] = useState<boolean>(false);

    const [grindState, setGrindState] = useState(INITIAL_GRIND_STATE); // Grind system state
    // const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null); // Unused in logic but kept if needed
    const [revealingCells, setRevealingCells] = useState<Set<string>>(new Set());
    const [coins, setCoins] = useState(INITIAL_COINS); // Track available coins
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        return (localStorage.getItem('nomo7-theme') as 'dark' | 'light') || 'dark';
    }); // Theme state

    // const [winAnimationMode, setWinAnimationMode] = useState<'smooth' | 'sharp'>('smooth'); // Animation style toggle - appears unused in UI interaction but logic exists? logic says 'sharp' hardcoded in gridcell

    const [timer, setTimer] = useState<number>(0); // Gameplay timer in seconds
    const [history, setHistory] = useState<Move[]>([]); // Move history for validation

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
    const startTimeRef = useRef<number>(Date.now());

    // Timer Effect: Use Date.now() delta to be robust against browser throttling
    useEffect(() => {
        let interval: number | undefined;
        if (gameState.status === 'playing') {
            // Sync start time with current timer (handles reset and potential resumes)
            startTimeRef.current = Date.now() - (timer * 1000);

            interval = window.setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setTimer(elapsed);
            }, 500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState.status]);
    // We omit 'timer' from deps to avoid re-triggering the effect on every tick, 
    // it's only for initialization when status becomes 'playing'.

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
        setLives(SURVIVAL_LIVES); // Reset lives
        setHiddenHintsMap({}); // Reset hidden hints
        setIsDebugVisible(false); // Reset debug on new game
        setIsCheckHintsActive(false); // Reset hint checking
        setWinCorner(null); // Reset win animation
        setLastCorrectCell(null); // Reset last correct cell tracking
        setHistory([]); // Reset history

        // Direct Access Prevention: If daily already solved, redirect to normal random game (Skip in DEV)
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'daily' && !import.meta.env.DEV) {
            const today = new Date().getUTCFullYear() + '-' + (new Date().getUTCMonth() + 1) + '-' + new Date().getUTCDate();
            if (localStorage.getItem('lastDailySolved') === today) {
                params.delete('mode');
                window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
                // Continue but it won't be in daily mode anymore
            }
        }

        try {
            let finalSeed: number;
            let finalSize: number;
            let finalDiff: DifficultyLevel;

            const params = new URLSearchParams(window.location.search);
            const isDaily = params.get('mode') === 'daily';

            // Priority 1: Direct seed input (dev/debug)
            if (seedVal && seedVal.trim().length > 0) {
                if (/^\d+$/.test(seedVal)) {
                    finalSeed = parseInt(seedVal, 10);
                } else {
                    finalSeed = stringToSeed(seedVal);
                }
                finalSize = selectedSize;
                finalDiff = selectedDifficulty;
            }
            // Priority 2: Daily mode (Deterministic)
            else if (isDaily) {
                const dailyConfig = DAILY_PUZZLE_CONFIG.get(new Date());
                finalSeed = dailyConfig.seed;
                finalSize = dailyConfig.size;
                finalDiff = dailyConfig.difficulty;
            }
            // Priority 3: Use challenge info from URL if available and NOT force-starting a new random game
            else if (challengeData.current && !forceRandom) {
                finalSeed = challengeData.current.seed;
                finalSize = challengeData.current.size;
                finalDiff = challengeData.current.difficulty;
            }
            // Priority 4: Random seed from pool
            else {
                const configKey = `${selectedSize}:${selectedDifficulty}`;
                const pool = (validSeeds as Record<string, number[]>)[configKey];

                if (pool && pool.length > 0) {
                    // Pick random from pool
                    const randomIndex = Math.floor(Math.random() * pool.length);
                    finalSeed = pool[randomIndex];
                } else {
                    // Fallback to purely random if pool is empty
                    finalSeed = Math.floor(Math.random() * 2000000000);
                }

                finalSize = selectedSize;
                finalDiff = selectedDifficulty;

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

            // Decouple difficulty config: use daily settings if in daily mode
            const diffConfig = isDaily ? DAILY_PUZZLE_CONFIG.SETTINGS : DIFFICULTY_CONFIG[finalDiff];
            const newPuzzle = await generatePuzzle(finalSeed, finalSize, finalDiff, diffConfig);

            setPuzzle(newPuzzle);
            setPlayerGrid(createEmptyGrid(newPuzzle.size));
            setGameState({ status: 'playing' });

            // Generate mystery hints for survival2 mode
            if (gameMode === 'survival2') {
                const allHints: { key: string, idx: number }[] = [];
                for (let r = 0; r < newPuzzle.size; r++) {
                    const count = getHintCountForLine(newPuzzle.grid[r]);
                    for (let i = 0; i < count; i++) allHints.push({ key: `row-${r}`, idx: i });
                }
                for (let c = 0; c < newPuzzle.size; c++) {
                    const col = newPuzzle.grid.map(row => row[c]);
                    const count = getHintCountForLine(col);
                    for (let i = 0; i < count; i++) allHints.push({ key: `col-${c}`, idx: i });
                }

                // Shuffle
                for (let i = allHints.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allHints[i], allHints[j]] = [allHints[j], allHints[i]];
                }

                const picked = allHints.slice(0, mysteryHintsCount);
                const map: Record<string, Set<number>> = {};
                picked.forEach(p => {
                    if (!map[p.key]) map[p.key] = new Set();
                    map[p.key].add(p.idx);
                });
                setHiddenHintsMap(map);
            }

        } catch (e) {
            setGameState({ status: 'error', errorMessage: 'Failed to generate puzzle.' });
        }
    }, [selectedSize, selectedDifficulty, gameMode, mysteryHintsCount]);

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

                // Mistake checking for Survival Mode
                if (gameMode === 'survival' || gameMode === 'survival2') {
                    // Mistake: user uses FILL on an actually empty cell
                    if (target === 0 && newState === CellState.FILLED) {
                        // Flash grid red
                        setIsErrorFlashing(true);
                        setTimeout(() => setIsErrorFlashing(false), ERROR_FLASH_DURATION_MS);

                        setLives(prev => {
                            const newLives = prev - 1;
                            if (newLives <= 0) {
                                setGameState({ status: 'game_over' });
                            }
                            return newLives;
                        });
                        // Auto-correct a mistake to prevent immediate re-click
                        newState = CellState.CROSSED;
                        newGrid[r][c] = newState;
                    }
                }

                // If this cell is now correct, update lastCorrectCell
                if ((target === 1 && newState === CellState.FILLED) ||
                    (target === 0 && newState !== CellState.FILLED)) {
                    setLastCorrectCell({ r, c });
                }

                // Record move logic
                // We only record if state actually changed (guaranteed by early return above)
                setHistory(prev => [...prev, {
                    r,
                    c,
                    newState,
                    time: timer * 1000
                }]);
            }

            return newGrid;
        });
    }, [puzzle, gameState.status, timer]);

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

        if (emptyCells.length < 3) return;

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

        setCoins(prev => prev - BLAST_COST);
    }, [puzzle, playerGrid, gameState.status, updateCell, coins]);

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

    const restartCurrentGame = useCallback(() => {
        if (!puzzle) return;
        setPlayerGrid(createEmptyGrid(puzzle.size));
        setTimer(0);
        setLives(SURVIVAL_LIVES);
        setGameState({ status: 'playing' });
        setWinCorner(null);
        setLastCorrectCell(null);
        startNewGame(puzzle.seed.toString(), false); // Re-run generation logic to re-roll hidden hints if in survival2 mode, or just restart
    }, [puzzle, startNewGame]);

    // Auto-start or restart game when settings change
    useEffect(() => {
        startNewGame();
    }, [selectedSize, selectedDifficulty, gameMode, mysteryHintsCount, startNewGame]);


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

    // Instant Win Cheat
    const cheatWin = () => {
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

    const addCoins = () => {
        setCoins(prev => prev + 10);
    };

    const resetDaily = () => {
        localStorage.removeItem('lastDailySolved');
        window.location.reload();
    };

    return {
        // State
        stats,
        puzzle,
        history,
        playerGrid,
        gameState,
        gameMode,
        lives,
        mysteryHintsCount,
        hiddenHintsMap,
        isErrorFlashing,
        timer,
        coins,
        theme,
        activeTool,
        selectedSize,
        selectedDifficulty,
        isMobile,
        isCheckHintsActive,
        isDebugVisible,
        winCorner,
        lastCorrectCell,
        revealingCells,
        showCopyMessage,

        // Setters (if needed directly)
        setGameMode,
        setMysteryHintsCount,
        setActiveTool,
        setSelectedSize,
        setSelectedDifficulty,
        setTheme,
        setIsDebugVisible,
        setIsCheckHintsActive,
        setCoins, // For cheat

        // Handlers
        startNewGame,
        handleMouseDown,
        handleMouseEnter,
        handleBlast,
        handleShare,
        restartCurrentGame,
        cheatWin,
        addCoins,
        resetDaily,

        // Helpers (Logic)
        isRowComplete: (r: number) => {
            if (!puzzle || !playerGrid.length) return false;
            for (let c = 0; c < puzzle.size; c++) {
                const target = puzzle.grid[r][c];
                const current = playerGrid[r][c];
                if (target === 1 && current !== CellState.FILLED) return false;
                if (target === 0 && current === CellState.FILLED) return false;
            }
            return true;
        },
        isColComplete: (c: number) => {
            if (!puzzle || !playerGrid.length) return false;
            for (let r = 0; r < puzzle.size; r++) {
                const target = puzzle.grid[r][c];
                const current = playerGrid[r][c];
                if (target === 1 && current !== CellState.FILLED) return false;
                if (target === 0 && current === CellState.FILLED) return false;
            }
            return true;
        }
    };
};
