import { DifficultyLevel, DifficultySettings } from './types';

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultySettings> = {
  VERY_EASY: {
    label: 'Very Easy (90-99%)',
    minDensity: 0.60,
    maxDensity: 0.79
  },
  EASY: {
    label: 'Easy (70-90%)',
    minDensity: 0.55,
    maxDensity: 0.60
  },
  MEDIUM: {
    label: 'Medium (50-70%)',
    minDensity: 0.50,
    maxDensity: 0.55
  },
  HARD: {
    label: 'Hard (30-50%)',
    minDensity: 0.4,
    maxDensity: 0.50
  },
  VERY_HARD: {
    label: 'Very Hard (10-30%)',
    minDensity: 0.10,
    maxDensity: 0.30
  }
};

export const GRID_SIZES = [5, 8, 10, 15, 20];

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
