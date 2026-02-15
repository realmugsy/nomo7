# AGENTS.md

## Project Overview

Nomo7 (formerly Nonogram World) is a procedurally generated nonogram puzzle game with React 18 frontend and Express backend. The project uses TypeScript for type safety and Tailwind CSS for styling.

## Build Commands

### Frontend (Root)
```bash
npm run dev           # Start Vite dev server on port 5173
npm run build         # Type-check and build production bundle
npm run preview       # Preview production build
```

### Backend (backend/)
```bash
cd backend
npm start             # Start Express server on port 3000
npm run dev           # Start with nodemon auto-reload
```

## Development Setup

1. Install all dependencies: `npm install`
2. Configure MongoDB connection in `backend/.env` (default: `mongodb://localhost:27017/nomo7`)
3. Start backend first: `cd backend && npm run dev`
4. Start frontend in another terminal: `npm run dev`
5. Frontend connects to backend via Vite proxy at `/api` → `http://localhost:3000`

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled (noImplicitAny, noFallthroughCasesInSwitch required)
- Use `react-jsx` for JSX transformation

### Naming Conventions
- Components: PascalCase (e.g., `GridCell.tsx`, `App.tsx`)
- Functions/methods: camelCase (e.g., `saveRecord`, `getPuzzleId`)
- Constants: UPPERCASE_SNAKE_CASE (e.g., `API_BASE_URL`, `CellState`)
- Interfaces: PascalCase (e.g., `PuzzleData`, `GameState`)
- Enums: PascalCase (e.g., `CellState`, `ToolType`)

### File Structure
- `src/`: React TypeScript components and services
- `src/types.ts`: Shared TypeScript interfaces and enums
- `src/components/`: React components
- `src/services/`: API service layer
- `src/hooks/`: Custom React hooks
- `backend/`: Node.js/Express API server
- `public/`: Static assets, HTML templates
- `dist/`: Build output directory

### Import Order
1. React and TypeScript imports
2. Project imports (relative)
3. External library imports

Example:
```typescript
import React from 'react';
import { RecordData, Move } from '../types';
```

### Error Handling
- Async functions must use try-catch blocks
- Log errors with `console.error()`
- Return error objects with `{ ok: false, error: string }` for API responses
- Never throw unhandled errors in production code
- Validate inputs and return 400 errors for invalid data

### Component Structure
- Use React.FC with explicit props interfaces
- Keep components small and focused (max ~200 lines)
- Extract reusable logic into hooks or separate services
- Use React.memo for expensive components
- Prefer function components over class components

### Styling
- Use Tailwind CSS for most styling
- Custom CSS only for animations and special effects
- Dark mode support via `dark:` prefix
- Use utility classes with explicit ordering (flex, items-center, justify-center)

### Backend Code Style (JavaScript)
- Use `require` for imports (Node.js style)
- Use `module.exports` for public functions
- Mongoose schemas with typed fields
- Express route handlers with error handling
- Use environment variables for configuration (dotenv)

### Type Safety
- All API responses must be typed with interfaces
- Define shared types in `src/types.ts`
- Use `unknown` or proper types instead of `any`
- Enum types for fixed value sets (CellState, ToolType, DifficultyLevel)

### Testing
- No test framework configured (add Jest/Vitest for future)
- Manual testing recommended via browser
- API validation logic in `backend/validation.js`
- Frontend-backend integration tested via Vite proxy

## Common Workflows

### Adding New Feature
1. Define types in `src/types.ts` if needed
2. Create component in `src/components/` or service in `src/services/`
3. Update `App.tsx` to integrate new feature
4. Test in dev mode with hot reload
5. Build for production: `npm run build`

### Backend Changes
1. Update backend code in `backend/` directory
2. Ensure validation logic matches frontend puzzle generation
3. Add environment variables to `.env` if needed
4. Test API endpoints with `curl` or Postman
5. Restart backend server with `npm run dev`

### Deployment
- Frontend builds to `dist/` directory
- Deploy `dist/` to static hosting (GitHub Pages, Vercel, Netlify)
- Backend runs as Node.js process, needs MongoDB instance
- Use existing deployment scripts: `deploy.bat`, `deploy-ec2.sh`

## Code Review Checklist
- [ ] TypeScript types are correct and used consistently
- [ ] Error handling implemented for async operations
- [ ] No `any` types used
- [ ] Components are memoized if needed
- [ ] Tailwind classes are correct and accessible
- [ ] Backend API uses proper HTTP status codes
- [ ] Environment variables are not hardcoded
- [ ] No console.log statements in production code
