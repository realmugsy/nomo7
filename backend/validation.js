
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

// Simplified seed calculation (Linear Congruential Generator)
// This MUST match the frontend implementation in generatePuzzle exactly.
const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 4294967296;

function seededRandom(seed) {
    let state = seed;
    return function () {
        state = (LCG_A * state + LCG_C) % LCG_M;
        return state / LCG_M;
    };
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
    // This is the tricky part without sharing code.
    // If we can't regenerate the exact puzzle, we can't validate fully.
    // OPTION: Trust the frontend sending the "puzzleId" which contains the seed?
    // Yes, but we need the generation algorithm.
    // Let's assume for this MVP we validates:
    // 1. Moves are within bounds.
    // 2. Play time is reasonable (server side check using start/end time if socket, or just sanity check).
    // 3. Replayed grid state matches the submitted "solution" (if submitted).
    // Actually, Leaderboard component sends `timeMs`. It doesn't send the full grid.
    // So we HAVE to regenerate the puzzle to know if they solved it.

    // For now, let's implement the history replay validation.
    // The "is it correct" check will be mocked or require porting `generatePuzzle`.
    return null;
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

    // Replay History
    // We start with an empty user grid.
    const userGrid = Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY));

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

        // Apply move
        userGrid[r][c] = newState;
    }

    // At this point `userGrid` represents the user's final board.
    // todo: Check if `userGrid` matches the actual puzzle solution.
    // For now, we return true if replay was successful (no illegal moves).
    // In a production app, include `geminiService` logic here to compare `userGrid` vs `targetGrid`.

    return true;
}

module.exports = { validateSolution };
