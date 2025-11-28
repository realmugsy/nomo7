import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { INITIAL_META_GAME_STATE, isMarkerUnlocked, unlockNextMarker, getAllMarkers } from './metagame';
import { INITIAL_GRIND_STATE, completeLevel } from './grind';
import { MARKER_POSITIONS, MARKER_CONNECTIONS } from './markerPositions';

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
  const [gameState, setGameState] = useState<GameState>({ status: 'idle' });
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
  const [isCheckHintsActive, setIsCheckHintsActive] = useState<boolean>(false);
  const [winCorner, setWinCorner] = useState<number | null>(null); // 0:TL, 1:TR, 2:BL, 3:BR
  const [lastCorrectCell, setLastCorrectCell] = useState<{r: number, c: number} | null>(null); // Track last correctly placed cell
  const [unlockedMarkers, setUnlockedMarkers] = useState<number[]>(INITIAL_META_GAME_STATE.unlockedMarkers); // Track unlocked meta layer markers
  const [grindState, setGrindState] = useState(INITIAL_GRIND_STATE); // Grind system state
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [revealingCells, setRevealingCells] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState(INITIAL_COINS); // Track available coins

  // Mouse drag scrolling state for map
  const [isMapDragging, setIsMapDragging] = useState(false);
  const [mapDragStart, setMapDragStart] = useState({ x: 0, y: 0 });
  const [mapScrollPosition, setMapScrollPosition] = useState(0);
  
  // Visibility toggles
  const [showMarkers, setShowMarkers] = useState(true);
  const [showMapBackground, setShowMapBackground] = useState(true);
  
  // Refs for DOM elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  // Get container width for infinite scrolling
  const getContainerWidth = () => {
    return mapContainerRef.current?.clientWidth || 1000;
  };

  // Controls
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.FILL);
  const [inputSeed, setInputSeed] = useState<string>('');
  
  // Settings
  const [selectedSize, setSelectedSize] = useState<number>(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Dragging State
  const isDragging = useRef<boolean>(false);
  const dragTargetState = useRef<CellState | null>(null);

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

  // Handle meta layer marker click
  const handleMarkerClick = (markerNumber: number) => {
    if (isMarkerUnlocked(markerNumber, unlockedMarkers)) {
      // Start a new game when an unlocked marker is clicked
      startNewGame();
    }
  };

  // Return to map
  const handleBackToMap = () => {
    setGameState({ status: 'idle' });
  };

  // Update unlocked markers when a game is won
  useEffect(() => {
    if (gameState.status === 'won' && puzzle) {
      // Unlock the next marker if it's not already unlocked
      setUnlockedMarkers(prev => unlockNextMarker(prev));
      
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
                setLastCorrectCell({r, c});
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
    setLastCorrectCell({r: Math.floor(puzzle.size/2), c: Math.floor(puzzle.size/2)});
    // Set game state to won
    setGameState({ status: 'won' });
    setIsDebugVisible(false);
    setIsCheckHintsActive(true);
  };

  // Blast Booster - Reveal 3 random cells
  const handleBlast = useCallback(() => {
    if (coins < BLAST_COST || !puzzle || !playerGrid.length || gameState.status !== 'playing') return;
    
    const emptyCells: {r: number, c: number}[] = [];
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
    if (size <= 20) return "w-3 h-3 md:w-4 md:h-4";
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

  // Auto-start game on component mount
  useEffect(() => {
    startNewGame();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 -z-10"></div>
       
      <header className="text-center space-y-2 mt-4">
        {/* Added pb-2 to prevent bg-clip-text from cutting off descenders */}
        <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 pb-2">
          Nonogram Puzzle
        </h1>
      </header>

      <div className="w-full max-w-3xl bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col items-center">
        
        {/* Top Controls Area - Only shown during gameplay */}
        {(gameState.status === 'playing' || gameState.status === 'won') && (
          <div className="flex flex-col items-center gap-4 w-full mb-4">
              
              {/* Settings Row */}
              <div className="flex flex-wrap gap-3 justify-center w-full">
                  {/* Size Selector */}
                  <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                      {GRID_SIZES.map(size => (
                          <option key={size} value={size}>Size: {size}x{size}</option>
                      ))}
                  </select>

                  {/* Difficulty Selector */}
                  <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                      {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((key) => (
                          <option key={key} value={key}>{DIFFICULTY_CONFIG[key].label}</option>
                      ))}
                  </select>

                  <input 
                      type="text" 
                      placeholder="Seed (Optional)" 
                      className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-32 text-center text-slate-200 placeholder-slate-500"
                      value={inputSeed}
                      onChange={(e) => setInputSeed(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && startNewGame(inputSeed)}
                  />
              </div>

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
                      <div className="text-xs text-slate-500 font-mono select-all cursor-pointer hover:text-slate-400 transition-colors" title="Current Game Seed">
                          Seed: {puzzle.seed}
                      </div>
                      
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
              className="grid gap-0 select-none bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-2xl touch-none mx-auto"
              style={{
                gridTemplateColumns: `auto repeat(${puzzle.size}, min-content)`,
              }}
              onContextMenu={(e) => e.preventDefault()}
            >

                {/* Top-Left Corner */}
                <div className="border-b border-r border-slate-800 bg-slate-900/50"></div>

                {/* Column Hints */}
                {colHints.map((col, i) => {
                const isThickRight = (i + 1) % 5 === 0 && i !== puzzle.size - 1;
                const isColCorrect = isCheckHintsActive && isColComplete(i);
                
                let classes = "bg-slate-900/50 border-b border-slate-800 pb-1 flex flex-col justify-end";
                if (isThickRight) classes += " border-r-2 border-r-slate-400";
                else classes += " border-r border-slate-800";
                
                return (
                    <div key={`col-hint-${i}`} className={classes}>
                        <Hints line={col} type="col" isComplete={isColCorrect} />
                    </div>
                );
                })}

                {/* Rows */}
                {rowHints.map((row, r) => {
                const isThickBottom = (r + 1) % 5 === 0 && r !== puzzle.size - 1;
                const isRowCorrect = isCheckHintsActive && isRowComplete(r);
                
                let hintClasses = "border-r border-slate-800 pr-1 flex items-center justify-end bg-slate-900/50";
                
                if (isThickBottom) hintClasses += " border-b-2 border-b-slate-400";
                else hintClasses += " border-b border-slate-800";

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
                                delay = `${Math.round(dist * 30)}ms`;
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
                                        borderRightThick={(c + 1) % 5 === 0 && c !== puzzle.size - 1}
                                        borderBottomThick={(r + 1) % 5 === 0 && r !== puzzle.size - 1}
                                        animationDelay={delay}
                                        animationDuration={`${WIN_ANIMATION_DURATION_MS}ms`}
                                        isRevealing={revealingCells.has(`${r}-${c}`)}
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

        {gameState.status === 'won' && puzzle && (
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
        )}

        {/* Meta Layer with Image Markers */}
        {gameState.status === 'idle' && (
          <div className="mt-4 w-full max-w-4xl">
            <div className="relative bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 min-h-[500px] overflow-hidden"
                 ref={mapContainerRef}
                 onMouseMove={(e) => {
                   // Handle map dragging for scrolling
                   if (isMapDragging) {
                     const deltaX = mapDragStart.x - e.clientX;
                     const newScrollPosition = mapScrollPosition + deltaX;
                     
                     // Apply constraints to prevent scrolling beyond first and last images
                     const containerWidth = getContainerWidth();
                     const minScroll = 0;
                     const maxScroll = (META_LAYER_MAP_IMAGES_COUNT - 1) * containerWidth;
                     const constrainedScroll = Math.max(minScroll, Math.min(maxScroll, newScrollPosition));
                     
                     setMapScrollPosition(constrainedScroll);
                     setMapDragStart({ x: e.clientX, y: e.clientY });
                   }
                   
                   // Calculate mouse position relative to the map container
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = e.clientX - rect.left;
                   const y = e.clientY - rect.top;
                   setMousePosition({ x, y });
                 }}
                 onMouseDown={(e) => {
                   // Start dragging for map scrolling
                   setIsMapDragging(true);
                   setMapDragStart({ x: e.clientX, y: e.clientY });
                 }}
                 onMouseUp={() => {
                   // Stop dragging for map scrolling
                   setIsMapDragging(false);
                 }}
                 onMouseLeave={() => {
                   // Stop dragging when mouse leaves and update mouse position
                   setIsMapDragging(false);
                   setMousePosition(null);
                 }}>
              {/* Infinite scrolling map background */}
              <div className="absolute inset-0" style={{ display: showMapBackground ? 'block' : 'none' }}>
                {/* Multiple copies of the map based on configuration */}
                {Array.from({ length: META_LAYER_MAP_IMAGES_COUNT }).map((_, index) => (
                  <div 
                    key={index}
                    className="absolute top-0 h-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: 'url(/src/map.png)',
                      width: '100%',
                      left: index * getContainerWidth() - mapScrollPosition,
                    }}
                  />
                ))}
              </div>
              
              {/* Coordinate grid overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{ display: showMapBackground ? 'block' : 'none' }}>
                {/* Multiple copies of the grid based on configuration */}
                {Array.from({ length: META_LAYER_MAP_IMAGES_COUNT }).map((_, index) => (
                  <div 
                    key={index}
                    className="absolute top-0 h-full"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px',
                      width: '100%',
                      left: index * getContainerWidth() - mapScrollPosition,
                    }}
                  />
                ))}
              </div>

              {/* Connection lines between markers */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 15, transform: `translateX(${-mapScrollPosition}px)` }}>
                {MARKER_CONNECTIONS.map(([markerA, markerB], index) => {
                  const posA = MARKER_POSITIONS[markerA];
                  const posB = MARKER_POSITIONS[markerB];
                  return (
                    <line
                      key={`connection-${index}`}
                      x1={posA.x}
                      y1={posA.y}
                      x2={posB.x}
                      y2={posB.y}
                      stroke="lime"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Markers container */}
              <div className="absolute inset-0"
                   ref={markersContainerRef}
                   style={{
                     width: '100%',
                     transform: `translateX(${-mapScrollPosition}px)`,
                     display: showMarkers ? 'block' : 'none' // Toggle marker visibility
                   }}>
                {/* Markers positioned absolutamente for precise placement */}
                {getAllMarkers().map((number) => {
                  const position = MARKER_POSITIONS[number];
                  return (
                    <div 
                      key={number}
                      className={`absolute flex flex-col items-center cursor-pointer transition-all transform hover:scale-110 ${
                        isMarkerUnlocked(number, unlockedMarkers) 
                          ? 'opacity-100 hover:opacity-90' 
                          : 'opacity-40 cursor-not-allowed'
                      }`}
                      style={{
                        left: `${position.x - 32}px`, // Adjust for 64px marker width (center alignment)
                        top: `${position.y - 32}px`   // Adjust for 64px marker height (center alignment)
                      }}
                      onClick={() => isMarkerUnlocked(number, unlockedMarkers) && handleMarkerClick(number)}
                    >
                      {/* Use marker.png image */}
                      <div className="w-16 h-16 flex items-center justify-center">
                        <img 
                          src="/src/marker.png" 
                          alt={`Marker ${number}`}
                          className="w-full h-full object-contain"
                        />
                        {/* Number overlay */}
                        <span className="absolute text-lg font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {number}
                        </span>
                      </div>
                      {/* Coordinate label showing center coordinates */}
                      <span className="text-xs text-slate-400 mt-1 font-mono">
                        [{position.x},{position.y}]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default App;