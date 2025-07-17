# CLAUDE.md

Real-time polling app: SvelteKit frontend + PartyKit WebSocket backend. Server-generated questions, anonymous voting.

## Commands

```bash
# Development
npm run dev              # Full stack (SvelteKit + PartyKit)
npm run dev:sveltekit    # Frontend only
npm run dev:party        # WebSocket server only

# Quality
npm run check            # TypeScript check
npm run lint             # Prettier check  
npm run format           # Auto-format

# Production
npm run build            # Build frontend
npm run party:deploy     # Deploy PartyKit
```

## Architecture

```
src/
├── routes/
│   ├── +page.svelte           # Home: create/join polls
│   ├── +page.server.ts        # Poll creation via lobby API
│   └── [poll_id]/
│       └── +page.svelte       # Poll voting UI + WebSocket

party/                          # PartyKit servers
├── lobby.ts                   # Main server: room registry, poll creation
├── poll.ts                    # Poll server: voting, state management
├── handlers.ts                # Business logic for messages/requests
├── questions.ts               # 15+ question bank
└── utils.ts                   # Helper functions

shared/schemas/                 # Zod schemas (runtime validation)
├── poll.ts                    # Poll, RoomMetadata types
├── message.ts                 # WebSocket message types
└── api.ts                     # HTTP request/response types

src/lib/
├── types.ts                   # Frontend TypeScript types
└── hooks/useWebSocket.svelte.ts  # WebSocket connection hook
```

## Key Patterns

### Type Safety
- Backend: Zod schemas in `shared/schemas/` for runtime validation
- Frontend: TypeScript types in `src/lib/types.ts`
- All messages validated with `MessageSchema.parse()`

### WebSocket Messages
```typescript
// Discriminated union in shared/schemas/message.ts
type Message = 
  | { type: 'vote'; option: string }
  | { type: 'poll-update'; poll: Poll }
  | { type: 'room-list-request' }
  | { type: 'room-list'; rooms: RoomMetadata[] }
```

### Poll Creation Flow
1. SvelteKit action posts to `/parties/main/main/create-poll`
2. Lobby generates poll ID, creates poll room via `context.parties.poll.get(pollId)`
3. Poll server generates random question, saves to storage
4. Lobby registers room in registry, broadcasts update to WebSocket clients
5. Returns poll data to frontend

### Environment Variables
```bash
# .env
PARTYKIT_URL=http://127.0.0.1:1999        # Backend URL (private)
PUBLIC_PARTYKIT_HOST=127.0.0.1:1999       # WebSocket host (public)
```

## Code Standards

### Imports
- No extensions needed for TypeScript imports
- Import types with `import type`
- Prefer alias paths (`$shared/`, `$lib/`) over relative paths

### Frontend (IMPORTANT)
- **Always use Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- Never use Svelte 4 patterns (stores, reactive statements)

### Validation (IMPORTANT)
- **Always validate with Zod** - use `MessageSchema.parse()` for all external data
- Return typed error responses with proper status codes

### State Management
- PartyKit: Room storage (persistent)
- Frontend: Svelte 5 runes only
- Vote tracking: localStorage (prevents duplicate votes per browser)

### Testing
No test framework configured. Check README or ask user for testing approach.