# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiplayer Choose-Your-Own-Adventure Game with real-time voting mechanics for 2-30 players.

**Tech Stack:**
- Frontend: SvelteKit + Svelte 5 (runes) + TypeScript
- Backend: Colyseus (Node.js/TypeScript) 
- Database: Neon PostgreSQL + Kysely (type-safe SQL)
- Auth: Lucia Auth
- Storage: Cloudflare R2
- Deploy: fly.io

## Project Structure

```
backend/               # Colyseus multiplayer server
├── src/
│   ├── schema/        # Colyseus schemas
│   ├── rooms/         # Game room logic
│   ├── database/      # Kysely queries
│   └── auth/          # Lucia auth

frontend/              # SvelteKit client
├── src/
│   ├── lib/
│   │   ├── stores/    # Svelte 5 runes state
│   │   └── components/ # Game UI components
│   └── routes/        # SvelteKit pages
```

## Core Architecture

**Game Flow:** Players join room → vote on scene targets → timer countdown → majority wins → next scene

**Database Schema:** campaigns → scenes → scene_targets (with x/y coordinates for clickable areas)

**Real-time State:** Colyseus manages player sessions, votes, and scene progression

## Development Commands

**Backend (Colyseus):**
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

**Frontend (SvelteKit):**
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # TypeScript check
npm run lint         # ESLint
```

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://...
LUCIA_SECRET=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
```

**Frontend (.env):**
```
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_API_URL=http://localhost:2567
```

## Testing

**Unified Vitest Workspace:**
```bash
npm test                    # Run all tests
npm run test:backend        # Backend tests only
npm run test:frontend       # Frontend tests only
npm run test:e2e           # Playwright E2E tests
npm run test:coverage      # Coverage reports
```

**Test Structure:**
- Backend: Unit tests with in-memory SQLite, Colyseus room testing
- Frontend: Svelte component tests, store testing with mocks
- E2E: Full multiplayer game flow with Playwright
- Shared: Common fixtures, utilities, and mocks

## Key Implementation Notes

- Use strict TypeScript (no `any` types)
- Kysely provides type-safe database queries
- Colyseus Schema classes handle real-time state synchronization
- Svelte 5 runes manage client-side reactive state
- Scene targets use percentage-based positioning for responsive design
- Voting timer runs server-side to prevent client manipulation
- Comprehensive test coverage with Vitest + Playwright