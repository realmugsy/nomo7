import { RecordData, TopRecordsResponse, Move } from "../types";

const API_BASE_URL = '/api';

/**
 * Format puzzle ID to be used as a unique identifier.
 * Format: size:difficulty:seed
 */
export const getPuzzleId = (size: number, difficulty: string, seed: number): string => {
    // Sanitize difficulty to ensure no spaces (e.g., "VERY EASY" -> "VERY_EASY")
    const sanitizedDifficulty = difficulty.replace(/\s+/g, '_').toUpperCase();
    return `${size}:${sanitizedDifficulty}:${seed}`;
};

/**
 * Save a game record to the database.
 */
export const saveRecord = async (
    puzzleId: string,
    playerName: string,
    timeMs: number,
    history?: Move[],
): Promise<{ ok: boolean; id?: string; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                puzzleId,
                playerName,
                timeMs,
                history,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to save record:', error);
        return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Get top records for a specific puzzle.
 */
export const getTopRecords = async (puzzleId: string, limit: number = 10, offset: number = 0): Promise<RecordData[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records/top?puzzleId=${encodeURIComponent(puzzleId)}&limit=${limit}&offset=${offset}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data: TopRecordsResponse = await response.json();
        return data.ok ? data.top : [];
    } catch (error) {
        console.error('Failed to fetch top records:', error);
        return [];
    }
};
