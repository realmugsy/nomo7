import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Types & Constants (Replicated from project) ---
const CellState = { EMPTY: 0, FILLED: 1, CROSSED: 2 };
const DIFFICULTY_CONFIG = {
    VERY_EASY: { minDensity: 0.63, maxDensity: 0.70 },
    EASY: { minDensity: 0.57, maxDensity: 0.62 },
    MEDIUM: { minDensity: 0.53, maxDensity: 0.58 },
    HARD: { minDensity: 0.48, maxDensity: 0.52 },
    VERY_HARD: { minDensity: 0.40, maxDensity: 0.48 }
};
const GRID_SIZES = [12, 15, 16];

// --- Deterministic Random (Mulberry32) ---
const mulberry32 = (seed) => {
    return () => {
        let t = (seed += 0x6D2B79F5) | 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

class Random {
    constructor(seed) { this.nextFloat = mulberry32(seed); }
    next() { return this.nextFloat(); }
    bool(chance = 0.5) { return this.next() < chance; }
}

// --- Grid Generation (Matches geminiService.ts) ---
function generateGrid(seed, size, difficulty) {
    const rng = new Random(seed);
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));
    const targetDensity = difficulty.minDensity + (rng.next() * (difficulty.maxDensity - difficulty.minDensity));
    const targetFillCount = Math.floor(size * size * targetDensity);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            grid[y][x] = rng.bool(targetDensity) ? 1 : 0;
        }
    }

    let currentFillCount = 0;
    grid.forEach(row => row.forEach(val => currentFillCount += val));
    let diff = currentFillCount - targetFillCount;

    const coords = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) coords.push({ y, x });
    for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    if (diff > 0) {
        for (const { x, y } of coords) {
            if (diff === 0) break;
            if (grid[y][x] === 1) { grid[y][x] = 0; diff--; }
        }
    } else if (diff < 0) {
        for (const { x, y } of coords) {
            if (diff === 0) break;
            if (grid[y][x] === 0) { grid[y][x] = 1; diff++; }
        }
    }
    return grid;
}

// --- Hint Calculation ---
function calculateHints(line) {
    const hints = [];
    let count = 0;
    for (const cell of line) {
        if (cell === 1) count++;
        else if (count > 0) { hints.push(count); count = 0; }
    }
    if (count > 0) hints.push(count);
    if (hints.length === 0) hints.push(0);
    return hints;
}

// --- Solver (Minimal port of NonogramSolver) ---
class Solver {
    constructor(size, rowHints, colHints) {
        this.size = size;
        this.rowHints = rowHints;
        this.colHints = colHints;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(CellState.EMPTY));
    }

    solve() {
        let changed = true;
        while (changed) {
            changed = false;
            for (let r = 0; r < this.size; r++) if (this.solveLine('row', r)) changed = true;
            for (let c = 0; c < this.size; c++) if (this.solveLine('col', c)) changed = true;
        }
        return this.isSolved();
    }

    solveLine(type, idx) {
        const line = type === 'row' ? this.grid[idx] : this.grid.map(r => r[idx]);
        const hints = type === 'row' ? this.rowHints[idx] : this.colHints[idx];
        const original = [...line];

        const configs = this.getConfigs(line, hints);
        if (configs.length === 0) return false;

        const newLine = [...line];
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== CellState.EMPTY) continue;
            let allFilled = true, allEmpty = true;
            for (const config of configs) {
                if (config[i] === CellState.FILLED) allEmpty = false;
                else allFilled = false;
            }
            if (allFilled) newLine[i] = CellState.FILLED;
            else if (allEmpty) newLine[i] = CellState.CROSSED;
        }

        let changed = false;
        for (let i = 0; i < line.length; i++) {
            if (original[i] !== newLine[i]) {
                if (type === 'row') this.grid[idx][i] = newLine[i];
                else this.grid[i][idx] = newLine[i];
                changed = true;
            }
        }
        return changed;
    }

    getConfigs(line, hints) {
        const results = [];
        const current = Array(line.length).fill(CellState.EMPTY);
        const backtrack = (hIdx, start) => {
            if (hIdx === hints.length) {
                const config = [...current].map(v => v === CellState.EMPTY ? CellState.CROSSED : v);
                for (let i = 0; i < config.length; i++) {
                    if (line[i] === CellState.FILLED && config[i] !== CellState.FILLED) return;
                    if (line[i] === CellState.CROSSED && config[i] === CellState.FILLED) return;
                }
                results.push(config);
                return;
            }
            const hint = hints[hIdx];
            const remain = hints.slice(hIdx + 1).reduce((a, b) => a + b, 0) + (hints.length - hIdx - 1);
            for (let i = start; i <= line.length - remain - hint; i++) {
                let ok = true;
                for (let j = 0; j < hint; j++) if (line[i + j] === CellState.CROSSED) { ok = false; break; }
                if (ok && i + hint < line.length && line[i + hint] === CellState.FILLED) ok = false;
                if (ok) for (let j = start; j < i; j++) if (line[j] === CellState.FILLED) { ok = false; break; }
                if (ok) {
                    for (let j = 0; j < hint; j++) current[i + j] = CellState.FILLED;
                    backtrack(hIdx + 1, i + hint + 1);
                    for (let j = 0; j < hint; j++) current[i + j] = CellState.EMPTY;
                }
            }
        };
        backtrack(0, 0);
        return results;
    }

    isSolved() { return !this.grid.some(row => row.includes(CellState.EMPTY)); }
}

// --- Main Generation Loop ---
async function run() {
    const pool = {};
    const SEEDS_PER_CONFIG = 200;

    for (const size of GRID_SIZES) {
        for (const [diffKey, diffConfig] of Object.entries(DIFFICULTY_CONFIG)) {
            const configKey = `${size}:${diffKey}`;
            console.log(`Generating for ${configKey}...`);
            pool[configKey] = [];

            let attempts = 0;
            let seedStartTime = Date.now();
            let seedAttempts = 0;
            while (pool[configKey].length < SEEDS_PER_CONFIG && attempts < 20000) {
                attempts++;
                seedAttempts++;
                const seed = Math.floor(Math.random() * 2000000000);
                const grid = generateGrid(seed, size, diffConfig);
                const rHints = grid.map(r => calculateHints(r));
                const cHints = Array(size).fill(0).map((_, c) => calculateHints(grid.map(r => r[c])));

                const solver = new Solver(size, rHints, cHints);
                if (solver.solve()) {
                    pool[configKey].push(seed);
                    const elapsed = Date.now() - seedStartTime;
                    console.log(`  Seed ${pool[configKey].length}/${SEEDS_PER_CONFIG} found in ${elapsed}ms (${seedAttempts} attempts)`);
                    seedStartTime = Date.now();
                    seedAttempts = 0;
                }
            }
        }
    }

    const outputDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'valid_seeds.json');

    let existingPool = {};
    if (fs.existsSync(outputPath)) {
        try {
            existingPool = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        } catch (e) {
            console.error("Error reading existing valid_seeds.json, starting fresh.");
        }
    }

    // Merge generated seeds
    for (const [key, seeds] of Object.entries(pool)) {
        existingPool[key] = seeds;
    }

    fs.writeFileSync(outputPath, JSON.stringify(existingPool, null, 2));
    console.log(`\nSuccessfully generated seeds! Saved to ${outputPath}`);
}

run();
