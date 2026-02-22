# Changelog

## [0.1.024] - 2026-02-22
### Added
- Added **Survival 2 (Mystery Hints)** game mode where hints are randomly hidden with '?' marks.
- Added **Error indication** via a customizable red glowing border flash when making a mistake in Survival modes.

### Changed
- Removed the heavy box-shadow from beneath the main game grid.

## [0.1.023] - 2026-02-18
### Fixed
- Fixed **Vertical Hints** issue where column hints wouldn't turn green when the column was completed.
- Optimized hint rendering by removing unused CSS classes.

## [0.1.022] - 2026-02-15
### Fixed
- Improved **Timer Robustness**: The game timer now uses `Date.now()` delta calculation to remain accurate even when the browser throttles the tab due to user inactivity or background mode.

## [0.1.021] - 2026-02-15
### Fixed
- Fixed **Puzzle Verification** failure by synchronizing the RNG consumption pattern between frontend and backend. The server now uses an identical `Random` class wrapper to ensure 100% deterministic grid generation.

## [0.1.020] - 2026-02-15
### Fixed
- Synchronized **Daily Puzzle** difficulty ranges with the backend validation logic. This ensures daily puzzle results are correctly verified on the server.

## [0.1.019] - 2026-02-15
### Changed
- Decoupled **Daily Puzzle** difficulty from regular puzzle settings. It now has its own dedicated configuration in `gameConfig.ts`.

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
