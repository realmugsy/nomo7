# Changelog

## [0.1.015] - 2026-02-15
- **Fix**: Improved backend validation logic (sanitized coordinates, relaxed time checks to account for 1s timer resolution).
- **Feature**: Added "Reset Daily" button in development mode for easier local testing.
- **Cleanup**: Synchronized version 0.1.015 across all language files.

## [0.1.014] - 2026-02-15
- Hid debug information and the "Win" (cheat) button for production builds.

## [0.1.013] - 2026-02-15
- Changed proxy target from `localhost` to `127.0.0.1` to resolve `ECONNREFUSED ::1` errors.

## [0.1.012] - 2026-02-15
- Fixed port mismatch: moved backend to port 3100 and updated Vite proxy.

## [0.1.011] - 2026-02-15
- Improved backend error reporting: `server.js` now returns detailed error messages in 500 responses.
- Sanitized `puzzleId` generation on frontend and backend to prevent spaces in identifiers.
- Fixed naming inconsistency for difficulty levels in `recordsService.ts` and `validation.js`.
- Investigated 500 Internal Server Error (likely MongoDB authentication failure).
