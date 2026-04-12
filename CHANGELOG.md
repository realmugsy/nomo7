# Changelog

## [0.1.035] - 2026-04-10
### Fixed
- Backend: Fixed a bug where activity records were not being fetched correctly due to an incorrect filter (`verified: true`) which doesn't exist in the Activity schema. This was causing the Win Rate charts to appear empty.

## [0.1.034] - 2026-04-10
### Added
- Analytics: Implemented advanced game activity tracking (Starts vs Completion).
- Analytics: Added "Win Rate by Mode" and "Win Rate by Difficulty" charts to the dashboard.
- Analytics: Logic to track "Abandonment" in Classic mode (not finished within 30 minutes).
- Backend: New `Activity` collection and endpoints (`/api/activity/start`, `/api/activity/event`) for volume tracking.

## [0.1.033] - 2026-04-10
### Added
- Analytics Dashboard: Added a "Today" button to the quick select options to quickly view game statistics for the current day.

## [0.1.032] - 2026-04-10
### Fixed
- Analytics Dashboard: Fixed an issue where the charts would not automatically update when a "Quick Select" date range (7 or 30 days) was chosen. Data now refreshes immediately upon selection.

## [0.1.031] - 2026-04-10
### Added
- Analytics Dashboard: Added date range filtering with manual "Start Date" and "End Date" inputs.
- Analytics Dashboard: Added "Quick Select" buttons (7 Days, 30 Days) and a "Reset" button for faster filtering.
- Analytics Dashboard: Charts now dynamically update based on the selected date range and reflect selected dates in their titles.

## [0.1.030] - 2026-04-10
### Changed
- Backend API (`/api/admin/records`) now supports date filtering via `startDate` and `endDate` parameters.
- Default view for analytics changed to the last 7 days.

## [0.1.029] - 2026-04-10
### Added
- Created a locally-run Analytics Dashboard (`/dashboard`) using Vite, React, Recharts, and TailwindCSS.
- Added a secure admin API endpoint (`/api/admin/records`) to `backend/server.js` (listening on port 3100 via Nginx proxy) to serve analytics data.

## [0.1.028] - 2026-04-09
### Fixed
- Synchronized difficulty config values between frontend and backend to fix validation rejections for `VERY_EASY`, `EASY`, `HARD`, and `VERY_HARD` modes.

### Added
- Added a "Play / Beat Record" button to the daily leaderboard modal to allow replaying historical daily puzzles.
- Added localization for the new leaderboard button across all supported languages.

## [0.1.027] - 2026-03-12
### Added
- Added **Game Mode tracking** to leaderboard records: the system now saves whether the game was played in Classic, Survival, or Survival 2 mode.
- Updated backend schema and frontend record submission logic to support the new `gameMode` field.


## [0.1.026] - 2026-03-11
### Added
- Implemented **Auto-Save Game Records**: game results are now automatically saved to the backend database as "Anonymous" as soon as a player wins.
- Added ability to update a previously auto-saved record with the player's name if they choose to submit one.

## [0.1.025] - 2026-03-11
### Fixed
- Fixed IDE problems: added `@types/node` dependency to resolve `vite.config.ts` errors, and configured VS Code to ignore `@tailwind` warnings in CSS.

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
