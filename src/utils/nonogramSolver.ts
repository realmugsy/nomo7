import { CellState } from "../types";

/**
 * A simple logical solver for Nonograms that uses the "Line Solver" approach.
 * It simulates human-like deduction rules.
 */
export class NonogramSolver {
    private size: number;
    private rowHints: number[][];
    private colHints: number[][];
    private grid: CellState[][];

    constructor(size: number, rowHints: number[][], colHints: number[][]) {
        this.size = size;
        this.rowHints = rowHints;
        this.colHints = colHints;
        this.grid = Array(size).fill(0).map(() => Array(size).fill(CellState.EMPTY));
    }

    /**
     * Tries to solve the nonogram logically.
     * @returns true if the puzzle is fully solved, false if it gets stuck.
     */
    public solve(): boolean {
        let changed = true;
        while (changed) {
            changed = false;

            // Solve rows
            for (let r = 0; r < this.size; r++) {
                if (this.solveLine(this.getRow(r), this.rowHints[r], (line) => this.setRow(r, line))) {
                    changed = true;
                }
            }

            // Solve columns
            for (let c = 0; c < this.size; c++) {
                if (this.solveLine(this.getCol(c), this.colHints[c], (line) => this.setCol(c, line))) {
                    changed = true;
                }
            }
        }

        return this.isSolved();
    }

    private getRow(r: number): CellState[] {
        return this.grid[r];
    }

    private setRow(r: number, line: CellState[]) {
        this.grid[r] = line;
    }

    private getCol(c: number): CellState[] {
        return this.grid.map(row => row[c]);
    }

    private setCol(c: number, line: CellState[]) {
        for (let r = 0; r < this.size; r++) {
            this.grid[r][c] = line[r];
        }
    }

    /**
     * Core logic for solving a single row or column.
     * Uses "Overlapping Positions" of all valid configurations.
     */
    private solveLine(line: CellState[], hints: number[], updateFn: (line: CellState[]) => void): boolean {
        const originalLine = [...line];
        const configs = this.getAllValidConfigs(line, hints);

        if (configs.length === 0) return false; // Should not happen for valid puzzles

        const newLine = [...line];

        // Intersection of all valid configurations
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== CellState.EMPTY) continue;

            let allFilled = true;
            let allEmpty = true;

            for (const config of configs) {
                if (config[i] === CellState.FILLED) allEmpty = false;
                else allFilled = false;
            }

            if (allFilled) newLine[i] = CellState.FILLED;
            else if (allEmpty) newLine[i] = CellState.CROSSED;
        }

        let changed = false;
        for (let i = 0; i < line.length; i++) {
            if (originalLine[i] !== newLine[i]) {
                changed = true;
                break;
            }
        }

        if (changed) {
            updateFn(newLine);
        }

        return changed;
    }

    /**
     * Generates all possible valid configurations for a line given its current state and hints.
     * This is a recursive approach. For larger grids (20x20), it might need optimization.
     */
    private getAllValidConfigs(line: CellState[], hints: number[]): CellState[][] {
        const results: CellState[][] = [];
        const current: CellState[] = Array(line.length).fill(CellState.EMPTY);

        const backtrack = (hintIdx: number, startPos: number) => {
            if (hintIdx === hints.length) {
                // All hints placed, fill remaining with crossed and verify
                const finalConfig = [...current];
                for (let i = 0; i < finalConfig.length; i++) {
                    if (finalConfig[i] === CellState.EMPTY) finalConfig[i] = CellState.CROSSED;
                }

                // Final check against constraints (must not conflict with known FILLED/CROSSED in original line)
                if (this.isConfigCompatible(finalConfig, line)) {
                    results.push(finalConfig);
                }
                return;
            }

            const currentHint = hints[hintIdx];
            const remainingHintsSum = hints.slice(hintIdx + 1).reduce((a, b) => a + b, 0);
            const remainingGaps = hints.length - hintIdx - 1;
            const lastPossibleStart = line.length - remainingHintsSum - remainingGaps - currentHint;

            for (let i = startPos; i <= lastPossibleStart; i++) {
                // Try placing hint at i
                let canPlace = true;
                for (let j = 0; j < currentHint; j++) {
                    if (line[i + j] === CellState.CROSSED) {
                        canPlace = false;
                        break;
                    }
                }

                // Must have gap after
                if (canPlace && i + currentHint < line.length && line[i + currentHint] === CellState.FILLED) {
                    canPlace = false;
                }

                // Must not have filled cells before startPos
                if (canPlace) {
                    for (let j = startPos; j < i; j++) {
                        if (line[j] === CellState.FILLED) {
                            canPlace = false;
                            break;
                        }
                    }
                }

                if (canPlace) {
                    // Place it
                    for (let j = 0; j < currentHint; j++) current[i + j] = CellState.FILLED;

                    backtrack(hintIdx + 1, i + currentHint + 1);

                    // Unplace it
                    for (let j = 0; j < currentHint; j++) current[i + j] = CellState.EMPTY;
                }
            }
        };

        backtrack(0, 0);
        return results;
    }

    private isConfigCompatible(config: CellState[], original: CellState[]): boolean {
        for (let i = 0; i < config.length; i++) {
            if (original[i] === CellState.FILLED && config[i] !== CellState.FILLED) return false;
            if (original[i] === CellState.CROSSED && config[i] === CellState.FILLED) return false;
        }
        return true;
    }

    private isSolved(): boolean {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === CellState.EMPTY) return false;
            }
        }
        return true;
    }
}
