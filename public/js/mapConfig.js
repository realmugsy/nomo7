// Map configuration settings
window.mapConfig = {
    gridCols: 30,
    gridRows: 20,
    hexagonSize: 20, // Base size of the hexagons in pixels
    zoom: 1.0,      // Default zoom level
    minZoom: 0.75,   // Minimum zoom limit
    maxZoom: 2.0,   // Maximum zoom limit
    hoverColorLight: '#cbd5e1', // Default: slate-300
    hoverColorDark: '#768cb4ff',  // Default: slate-700
    hoverStrokeColorLight: '#4f46e5', // Primary indigo
    hoverStrokeColorDark: '#001affff',  // Indigo-400
    seed: 'adventure-map-1',         // Random seed for map generation
    fillPercentage: 0.65,            // Percentage of hexagons to color (0.0 to 1.0)
    hoverStrokeWidth: 5.0,           // Border thickness on hover (in screen pixels)
    hoverStrokeOpacity: 1.0,          // Opacity of the border on hover (0.0 to 1.0)
};
