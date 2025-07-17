# Lop - Multiplayer Voting Game

A real-time multiplayer voting game built with SvelteKit and PartyKit. Create polls with fun questions and watch as players vote in real-time!

## Features

- 🎲 **Random Questions** - Server-generated polls from a curated question bank
- ⚡ **Real-time Updates** - Live vote counting via WebSocket connections
- 🎮 **Multiplayer** - Share poll IDs for friends to join instantly
- 📊 **Active Rooms** - Browse and join ongoing polls
- 🚀 **Fast & Simple** - No login required, jump right in

## Tech Stack

- **Frontend**: SvelteKit + Svelte 5 (with runes)
- **Backend**: PartyKit (WebSocket server)
- **Validation**: Zod schemas
- **Styling**: Vanilla CSS
- **Deployment**: Netlify (frontend) + PartyKit (backend)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/lop.git
cd lop
```

2. Install dependencies
```bash
npm install
```

3. Copy environment variables
```bash
cp .env.example .env
```

4. Start development servers
```bash
npm run dev
```

This starts both the SvelteKit frontend (http://localhost:5173) and PartyKit backend (http://localhost:1999).

## Development

### Available Scripts

```bash
npm run dev              # Run both frontend and backend
npm run dev:sveltekit    # Frontend only
npm run dev:party        # Backend only
npm run build           # Build for production
npm run preview         # Preview production build
npm run check           # TypeScript checking
npm run lint            # Check code formatting
npm run format          # Auto-format code
```

### Project Structure

```
src/                    # SvelteKit frontend
├── routes/             # Pages and server endpoints
├── lib/                # Shared utilities and types
└── app.html            # HTML template

party/                  # PartyKit backend
├── lobby.ts            # Main server (room registry)
├── poll.ts             # Poll server (voting logic)
├── handlers.ts         # Business logic
├── questions.ts        # Question bank
└── utils.ts            # Helper functions

shared/schemas/         # Zod validation schemas
├── poll.ts             # Poll data structures
├── message.ts          # WebSocket messages
└── api.ts              # HTTP requests/responses
```

## Deployment

### Frontend (Netlify)

```bash
npm run build
# Deploy the 'build' directory to Netlify
```

### Backend (PartyKit)

```bash
npm run party:deploy
```

## Environment Variables

See `.env.example` for required variables:
- `PARTYKIT_URL` - Backend HTTP endpoint
- `PUBLIC_PARTYKIT_HOST` - WebSocket host for frontend

## Contributing

Pull requests are welcome! Please ensure:
- Code passes TypeScript checks (`npm run check`)
- Code is formatted (`npm run format`)
- Follow existing patterns for consistency

## License

MIT