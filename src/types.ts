
export enum CellState {
  EMPTY = 0,
  FILLED = 1,
  CROSSED = 2 // User marked as definitely empty
}

export interface PuzzleData {
  title: string;
  grid: number[][]; // 0 or 1
  size: number;
  seed: number;
  difficulty: DifficultyLevel;
}

export interface GameState {
  status: 'idle' | 'playing' | 'won' | 'loading' | 'error';
  errorMessage?: string;
}

export enum ToolType {
  FILL = 'FILL',
  CROSS = 'CROSS'
}

export type DifficultyLevel = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export interface DifficultySettings {
  label: string;
  minDensity: number;
  maxDensity: number;
}

export interface Move {
  r: number;
  c: number;
  newState: CellState; // Explicit state
  time: number;
}

export interface RecordData {
  _id?: string;
  puzzleId: string;
  playerName: string;
  timeMs: number;
  createdAt?: string;
  history?: Move[];
}

export interface TopRecordsResponse {
  ok: boolean;
  puzzleId: string;
  top: RecordData[];
}