// Marker positions on the map (in pixels) - These are center coordinates
export interface MarkerPosition {
  x: number;
  y: number;
}

// Define which markers should be connected with lines
export const MARKER_CONNECTIONS: [number, number][] = [
  [1, 5], [2, 1],// Connect marker 1 to marker 5
  // Add more connections here as needed
  // [2, 3], [4, 6], etc.
];

// Default positions for markers (center coordinates)
export const MARKER_POSITIONS: Record<number, MarkerPosition> = {
  1: { x: 100, y: 200 },
  2: { x: 150, y: 80 },
  3: { x: 250, y: 120 },
  4: { x: 500, y: 200 },
  5: { x: 200, y: 250 },
  6: { x: 300, y: 180 },
  7: { x: 120, y: 350 },
  8: { x: 280, y: 320 },
  9: { x: 180, y: 400 },
  10: { x: 750, y: 400 }
};

// Update marker position
export const updateMarkerPosition = (markerNumber: number, x: number, y: number): void => {
  MARKER_POSITIONS[markerNumber] = { x, y };
};