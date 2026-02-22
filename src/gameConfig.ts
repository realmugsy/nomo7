import { DifficultyLevel, DifficultySettings } from './types';

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultySettings> = {
  VERY_EASY: {
    label: 'Very Easy (64-70%)',
    minDensity: 0.63,
    maxDensity: 0.70
  },
  EASY: {
    label: 'Easy (58-62%)',
    minDensity: 0.57,
    maxDensity: 0.62
  },
  MEDIUM: {
    label: 'Medium (53-58%)',
    minDensity: 0.53,
    maxDensity: 0.58
  },
  HARD: {
    label: 'Hard (48-52%)',
    minDensity: 0.48,
    maxDensity: 0.52
  },
  VERY_HARD: {
    label: 'Very Hard (40-48%)',
    minDensity: 0.40,
    maxDensity: 0.48
  }
};

export const GRID_SIZES = [5, 7, 8, 10, 12, 15, 16, 20, 25];

// Meta layer settings
export const META_LAYER_MAP_IMAGES_COUNT = 3; // Number of map images to stitch together

// Duration of the win animation cycle (one way) in milliseconds
export const WIN_ANIMATION_DURATION_MS = 3000;

// Border width for grid cells in pixels
export const CELL_BORDER_WIDTH_PX = 2;

// Marker settings for crossed cells
export const MARKER_BORDER_WIDTH = 3; // Border width in pixels
export const MARKER_BORDER_COLOR = '#f87171'; // Red-400 from Tailwind

// Marker settings for filled cells
export const FILLED_CELL_BORDER_WIDTH = 1; // Border width in pixels
export const FILLED_CELL_BORDER_COLOR = '#4a4a54'; // Indigo-400 from Tailwind

// Cross marker size
export const CROSS_MARKER_SIZE = 'h-4 w-4 md:h-5 md:w-5';

// Victory animation border
export const VICTORY_ANIMATION_BORDER_WIDTH = 2; // Border width in pixels
export const VICTORY_ANIMATION_BORDER_COLOR = '#818cf8'; // Indigo-400 from Tailwind

// Filled cell marker reduction (pixels to reduce from each side)
export const FILLED_CELL_MARKER_REDUCTION_PX = 2; // Reduce marker by 4px on each side

export const BLAST_REVEAL_DELAY_MS = 500; // ms between sequential cell reveals (1 second)

export const INITIAL_COINS = 20;
export const BLAST_COST = 3;

// Daily Puzzle Settings
export const DAILY_DIFFICULTY_CONFIG: DifficultySettings = {
  label: 'Daily Special',
  minDensity: 0.52,
  maxDensity: 0.58
};

export const getDailyPuzzleConfig = (date: Date) => {
  const YYYY = date.getUTCFullYear();
  const MM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(date.getUTCDate()).padStart(2, '0');
  const seed = parseInt(`${YYYY}${MM}${DD}`, 10);

  // Deterministic size based on seed to match mockup variety (10, 12, 15, 20)
  const sizes = [10, 12, 15, 20];
  // Using a simple hash for size selection
  const sizeIndex = (seed * 31 + 7) % sizes.length;
  const size = sizes[sizeIndex];

  return {
    seed,
    size,
    difficulty: 'DAILY' as DifficultyLevel // Use a special marker or just ignore it in logic
  };
};

export const DAILY_PUZZLE_CONFIG = {
  get: getDailyPuzzleConfig,
  DIFFICULTY: 'DAILY' as DifficultyLevel,
  SETTINGS: DAILY_DIFFICULTY_CONFIG
};
export const SURVIVAL_LIVES = 3;
export const DEFAULT_MYSTERY_HINTS_COUNT = 3;

// Survival mode error indication
export const ERROR_FLASH_DURATION_MS = 400;
export const ERROR_FLASH_CLASSES = "ring-4 ring-rose-500 shadow-[0_0_40px_15px_rgba(225,29,72,0.8)] dark:shadow-[0_0_40px_15px_rgba(225,29,72,0.9)] z-50 relative scale-[1.01]";
