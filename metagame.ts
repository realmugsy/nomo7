// Meta game logic and state management
export interface MetaGameState {
  unlockedMarkers: number[];
}

// Initial meta game state
export const INITIAL_META_GAME_STATE: MetaGameState = {
  unlockedMarkers: [1] // Initially only the first marker is unlocked
};

// Check if a marker is unlocked
export const isMarkerUnlocked = (markerNumber: number, unlockedMarkers: number[]): boolean => {
  return unlockedMarkers.includes(markerNumber);
};

// Unlock the next marker
export const unlockNextMarker = (unlockedMarkers: number[]): number[] => {
  const nextMarker = Math.min(unlockedMarkers.length + 1, 10);
  if (!unlockedMarkers.includes(nextMarker)) {
    return [...unlockedMarkers, nextMarker];
  }
  return unlockedMarkers;
};

// Get all markers (1-10)
export const getAllMarkers = (): number[] => {
  return Array.from({ length: 10 }, (_, i) => i + 1);
};