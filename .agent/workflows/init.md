---
description: Initialize and verify the development environment
---

# Project Initialization Workflow

This workflow sets up and verifies the Nonogram World development environment.

## Prerequisites Check

1. Verify Node.js is installed (required for npm)
2. Check if dependencies are installed

## Setup Steps

// turbo-all

3. Install project dependencies
```bash
npm install
```

4. Install backend dependencies (if backend exists)
```bash
cd backend && npm install && cd ..
```

5. Verify the build system works
```bash
npm run build
```

6. Start the development server
```bash
npm run dev
```

## Verification

7. Check that the dev server is running on http://localhost:5173
8. Verify that the backend server (if applicable) is configured and accessible

## Notes

- The project uses Vite as the build tool
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Node.js API for leaderboard/records (MongoDB)
- Version is tracked in `package.json` and `public/lang/en.json`
