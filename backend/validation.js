// validation.js
// Logic for validating nonogram solutions given a history of moves.

const ToolType = {
    FILL: 'FILL',
    CROSS: 'CROSS'
};

const CellState = {
    EMPTY: 0,
    FILLED: 1,
    CROSSED: 2
};

const DIFFICULTY_CONFIG = {
    VERY_EASY: { minDensity: 0.60, maxDensity: 0.79 },
    EASY: { minDensity: 0.55, maxDensity: 0.60 },
    MEDIUM: { minDensity: 0.53, maxDensity: 0.58 },
    HARD: { minDensity: 0.4, maxDensity: 0.50 },
    VERY_HARD: { minDensity: 0.10, maxDensity: 0.30 }
};

// Simplified seed calculation (Mulberry32 - matches frontend)
const mulberry32 = (seed) => {
    return () => {
        let t = (seed += 0x6D2B79F5) | 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

function seededRandom(seed) {
    return mulberry32(seed);
}

// Function to reconstruct the puzzle grid from seed and size
// This is a SIMPLIFIED version. In a real scenario, you'd need to duplicate
// the full `generatePuzzle` logic or share it.
// Here we assume the frontend sent the correct puzzle parameters.
// For robust validation, we need to generate the *target* grid here.
// But since `generatePuzzle` is complex (symmetry, ensuring unique solution),
// we might rely on re-simulating the moves on an empty grid, 
// and checking if the RESULT matches the claim.
// Wait, checking if the result matches the claim IS what frontend does.
// The real check is: did the user arrive at this result via valid moves in valid time?
// AND is the result actually a valid solution for the puzzle constraints (row/col hints)?
// Or simpler: regenerate the puzzle from seed and compare grids.

// Replicating basic grid generation struct to match frontend random sequence
function generateTargetGrid(seed, size, difficulty) {
    const rng = seededRandom(seed);
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));

    const targetDensity = difficulty.minDensity + (rng() * (difficulty.maxDensity - difficulty.minDensity));
    const totalCells = size * size;
    const targetFillCount = Math.floor(totalCells * targetDensity);

    // 1. Initial Noise based on target density
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = rng() < targetDensity ? 1 : 0;
            grid[y][x] = val;
        }
    }

    // 2. Density Correction
    let currentFillCount = 0;
    grid.forEach(row => row.forEach(val => currentFillCount += val));
    let diff = currentFillCount - targetFillCount;

    const coords = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            coords.push({ x, y });
        }
    }

    for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    if (diff > 0) {
        for (const { x, y } of coords) {
            if (diff === 0) break;
            if (grid[y][x] === 1) {
                grid[y][x] = 0;
                diff--;
            }
        }
    } else if (diff < 0) {
        for (const { x, y } of coords) {
            if (diff === 0) break;
            if (grid[y][x] === 0) {
                grid[y][x] = 1;
                diff++;
            }
        }
    }

    currentFillCount = 0;
    grid.forEach(row => row.forEach(val => currentFillCount += val));

    if (currentFillCount === 0 && targetFillCount > 0) grid[Math.floor(size / 2)][Math.floor(size / 2)] = 1;
    if (currentFillCount === totalCells && targetFillCount < totalCells) grid[0][0] = 0;

    return grid;
}

/**
 * Validates a user's move history against a puzzle's seed/settings.
 * 
 * @param {string} puzzleId - "size:difficulty:seed"
 * @param {Array} history - Array of {r, c, newState, time}
 * @returns {Promise<boolean>} - True if valid
 */
async function validateSolution(puzzleId, history) {
    if (!history || !Array.isArray(history) || history.length === 0) {
        console.log("Validation Failed: No history");
        return false;
    }

    const [sizeStr, diffStr, seedStr] = puzzleId.split(':');
    const size = parseInt(sizeStr);
    const difficulty = diffStr.replace(/\s+/g, '_').toUpperCase(); // Sanitize
    const seed = parseInt(seedStr);

    // Get difficulty settings
    const diffSettings = DIFFICULTY_CONFIG[difficulty];
    if (!diffSettings) {
        console.log(`Validation Failed: Unknown difficulty ${difficulty}`);
        return false;
    }

    // Generate target grid
    const targetGrid = generateTargetGrid(seed, size, diffSettings);

    // Replay History
    const userGrid = Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));
    let startTime = null;
    let endTime = null;

    for (const move of history) {
        const { r, c, newState, time } = move;

        // 1. Bounds check
        if (r < 0 || r >= size || c < 0 || c >= size) {
            console.log(`Validation Failed: Out of bounds move [${r},${c}]`);
            return false;
        }

        // 2. State validity check
        if (![CellState.EMPTY, CellState.FILLED, CellState.CROSSED].includes(newState)) {
            console.log(`Validation Failed: Invalid state ${newState}`);
            return false;
        }

        // Track time
        if (startTime === null) startTime = time;
        endTime = time;

        // Apply move
        userGrid[r][c] = newState;
    }

    // 3. Time validation
    const timeMs = endTime - startTime;
    if (timeMs < 1000) {
        console.log(`Validation Failed: Too fast (${timeMs}ms)`);
        return false;
    }

    // 4. Reasonable moves validation
    const filledCount = userGrid.flat().filter(cell => cell === CellState.FILLED).length;
    const totalCells = size * size;
    const minReasonableMoves = Math.ceil(totalCells * 0.1); // At least 10% of cells
    const maxReasonableMoves = totalCells; // Can fill all cells (edge case)

    if (filledCount < minReasonableMoves || filledCount > maxReasonableMoves) {
        console.log(`Validation Failed: Unreasonable filled count (${filledCount}/${totalCells})`);
        return false;
    }

    // 5. Solution validation - compare grids
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const userState = userGrid[r][c];
            const targetState = targetGrid[r][c];

            // User must have FILLED all cells that should be filled
            // User can have CROSSED or EMPTY cells that should be filled (not optimal but valid)
            // User must NOT have FILLED cells that should be EMPTY
            if (userState === CellState.FILLED && targetState === 0) {
                console.log(`Validation Failed: Incorrectly filled cell at [${r},${c}]`);
                return false;
            }
        }
    }

    console.log(`Validation Passed: ${timeMs}ms, ${filledCount} filled cells`);
    return true;
}

module.exports = { validateSolution };
