# Choose Your Own Adventure - Multiplayer Game

A real-time multiplayer voting game where 2-30 players click on scene targets to vote on story progression.

## Tech Stack

- **Frontend**: SvelteKit + Svelte 5 (runes) + TypeScript
- **Backend**: Colyseus (Node.js/TypeScript)
- **Database**: Neon PostgreSQL + Kysely (type-safe SQL)
- **Auth**: Lucia Auth
- **Storage**: Cloudflare R2
- **Deploy**: fly.io

## Project Structure

```
cyoa-backend/          # Colyseus multiplayer server
├── src/
│   ├── schema/        # Colyseus schemas
│   ├── rooms/         # Game room logic
│   ├── database/      # Kysely queries
│   └── auth/          # Lucia auth

cyoa-frontend/         # SvelteKit client
├── src/
│   ├── lib/
│   │   ├── stores/    # Svelte 5 runes state
│   │   └── components/ # Game UI components
│   └── routes/        # SvelteKit pages
```

## Setup Instructions

### 1. Database Setup

1. Create a Neon PostgreSQL database
2. Run the SQL from `database-setup.sql` to create tables and sample data
3. Note your database connection string

### 2. Backend Setup

```bash
cd cyoa-backend
npm install
cp .env.example .env
# Edit .env with your database URL
npm run dev
```

### 3. Frontend Setup

```bash
cd cyoa-frontend
npm install
cp .env.example .env
# Edit .env with backend URLs (defaults should work for local dev)
npm run dev
```

## Game Flow

1. Players join game room → see scene image with clickable targets
2. Vote by clicking targets → timer counts down (30s default)  
3. Majority vote wins → next scene loads → repeat until story ends

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@host:port/database
LUCIA_SECRET=your-secret-key-here
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
NODE_ENV=development
PORT=2567
```

### Frontend (.env)
```
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_API_URL=http://localhost:2567
```

## Development

**Backend Commands:**
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```

**Frontend Commands:**
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run check    # TypeScript check
npm run lint     # ESLint
```

## Features

- Real-time multiplayer voting (2-30 players)
- Percentage-based clickable areas on scene images
- Timer-based voting rounds
- Mobile responsive design
- Strict TypeScript throughout
- Type-safe database queries with Kysely
- Svelte 5 runes for reactive state management

## Database Schema

- `campaigns`: Story campaigns with title and description
- `scenes`: Individual story scenes with images and timer settings
- `scene_targets`: Clickable areas with coordinates and next scene links

Scene targets use percentage-based positioning for responsive design across different screen sizes.