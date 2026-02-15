# Changelog

## [0.1.018] - 2026-02-15
### Fixed
- Fixed missing "Leaderboard" link on the dedicated leaderboard page by making it a static part of the header.
- Corrected active navigation highlighting for the leaderboard page.

## [0.1.017] - 2026-02-15
### Changed
- Replaced the blue square icon in the logo with the actual site favicon.

## [0.1.016] - 2026-02-15
### Fixed
- Fixed critical rendering issue in `App.tsx` where the puzzle wouldn't display due to orphaned state references.
- Corrected leaderboard link behavior: now uses standard navigation instead of React state.

### Changed
- Moved **Daily Puzzle Archive** to a dedicated separate page (`/leaderboard.html`).
- Optimized application entry points for better performance.

## [0.1.015] - 2026-02-15
### Added
- **Daily Puzzle Archive**: A new page to view all daily puzzles of the month.
- **Top 10 Leaderboard**: Clicking on an archive row now shows the global top 10 results for that day.
- **Header Integration**: Moved the Leaderboard link to the main site navigation using Portals.
- **Universal Access**: Leaderboard link is now available on all static pages (Rules, Map, etc.).

### Fixed
- Fixed timezone mismatch between client and server for daily puzzle IDs.
- Fixed time display formatting where milliseconds were treated as seconds.
- Fixed backend 500 errors due to file corruption.
- Corrected "verified: false" issue for valid daily puzzle completions.
