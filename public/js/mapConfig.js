// Map configuration settings
window.mapConfig = {
    gridCols: 15,
    gridRows: 10,
    hexagonSize: 20, // Base size of the hexagons in pixels
    zoom: 1.5,      // Default zoom level
    minZoom: 1.0,   // Minimum zoom limit
    maxZoom: 4.0,   // Maximum zoom limit
    hoverColorLight: '#cbd5e1', // Default: slate-300
    hoverColorDark: '#768cb4ff',  // Default: slate-700
    hoverStrokeColorLight: '#4e46e5ff', // Primary indigo
    hoverStrokeColorDark: '#001affff',  // Indigo-400
    seed: 'adventure-map-1',         // Random seed for map generation
    fillPercentage: 0.65,            // Percentage of hexagons to color (0.0 to 1.0)
    hoverStrokeWidth: 5.0,           // Border thickness on hover (in screen pixels)
    hoverStrokeOpacity: 1.0,          // Opacity of the border on hover (0.0 to 1.0)
    showEmptyBorders: false,         // Whether to show borders between empty hexagons
    fillPadding: 3.0,                // Margin between hexagon fill and its border (in pixels)
    // Palette of 10 colors for hexagons (can be used for different terrain types or levels)
    hexColors: [
        '#fde68a', // Step 1 (Yellow-200)
        '#f5d67c', // Step 2
        '#edc66e', // Step 3
        '#e5b660', // Step 4
        '#dda652', // Step 5
        '#d59644', // Step 6
        '#cd8636', // Step 7
        '#c57628', // Step 8
        '#bd661a', // Step 9
        '#b45309'  // Step 10 (Yellow-700)
    ]
};
