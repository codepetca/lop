# CLAUDE.md

Multi-game platform: SvelteKit frontend + PartyKit WebSocket backend. Supports real-time polling and story-based multiplayer games with voting mechanics.

## Commands

```bash
# Development
npm run dev              # Full stack (SvelteKit + PartyKit)
npm run dev:sveltekit    # Frontend only
npm run dev:party        # WebSocket server only
npm run dev:fresh        # Clean dev start with port cleanup
npm run kill-ports       # Kill development ports

# Quality
npm run check            # TypeScript check
npm run lint             # Prettier check
npm run format           # Auto-format

# Production
npm run build            # Build frontend
npm run party:deploy     # Deploy PartyKit

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
```

## Architecture

```
src/routes/
├── +page.svelte           # Home: create/join polls & games
├── +page.server.ts        # Poll/game creation via lobby API
├── [poll_id]/+page.svelte # Poll voting UI + WebSocket
└── game/[id]/+page.svelte # Story game UI + WebSocket

party/                     # PartyKit servers
├── lobby.ts              # Main server: room registry
├── poll.ts               # Poll server: voting, state management
├── game.ts               # Game server: story games, voting
├── avatar.ts             # Avatar generation service
├── stories.ts            # Story template management
├── nameGenerator.ts      # Name generation service
├── handlers.ts           # Business logic for messages/requests
├── questions.ts          # Poll question bank
├── utils.ts              # Helper functions
└── lib/
    ├── hooks.ts          # WebSocket & storage hooks
    └── server.ts         # Base server class

shared/schemas/           # Zod schemas (runtime validation)
├── poll.ts              # Poll, RoomMetadata types
├── game.ts              # Game, Player, Choice types
├── story.ts             # Story template system
├── player.ts            # Player management
├── message.ts           # WebSocket message types
└── api.ts               # HTTP request/response types

src/lib/
├── components/          # Svelte components (hierarchical)
├── stores/              # Svelte 5 runes state management
├── avatar/              # Avatar generation utilities
├── types.ts             # Frontend TypeScript types
└── hooks/useWebSocket.svelte.ts  # WebSocket connection hook

tests/
├── backend/             # Backend logic tests
├── frontend/            # Frontend tests
└── utils/               # Test utilities (fixtures, mocks)
```

## Component Architecture

**Prioritize hierarchical, composed components for reusability and maintainability:**

- `ErrorPage` - Centralized error handling
- `AvatarSelector` - Avatar customization interface  
- `GameAvatar`/`PlayerAvatar` - Avatar display components
- `PlayerProfileModal` - Player profile management
- `AdvancedOptionsModal` - Game configuration
- `TitleHeader` - Consistent header component

**Composition Guidelines:**
- Build larger components from smaller, focused ones
- Use Svelte 5 runes for reactive state (`$state`, `$derived`, `$effect`)
- Export components from `$lib` for centralized access

## Key Patterns

### Type Safety

- Backend: Zod schemas in `shared/schemas/` for runtime validation
- Frontend: TypeScript types in `src/lib/types.ts`
- All messages validated with `MessageSchema.parse()`

### WebSocket Messages

```typescript
// Discriminated union supporting polls & games
type Message =
	| { type: 'vote'; option: string }
	| { type: 'poll-update'; poll: Poll }
	| { type: 'game-choice'; choiceIndex: number }
	| { type: 'game-update'; game: Game }
	| { type: 'player-joined'; player: Player }
	| { type: 'room-list-request' }
	| { type: 'room-list'; rooms: RoomMetadata[] };
```

### Game Creation Flow

**Polls**: SvelteKit action → lobby generates ID → poll server creates question → room registry update
**Games**: SvelteKit action → lobby generates ID → game server selects story → player management → real-time voting with time limits

### Player & Avatar System

- UUID-based player identification with localStorage persistence
- DiceBear avatar generation (22+ styles) with deterministic seeding
- Generated names with uniqueness guarantees
- Avatar customization and regeneration support

### Environment Variables

```bash
# .env
PARTYKIT_URL=http://127.0.0.1:1999        # Backend URL (private)
PARTYKIT_HOST=http://127.0.0.1:1999       # Backend host (private)
PUBLIC_PARTYKIT_HOST=127.0.0.1:1999       # WebSocket host (public)
```

**Configuration Management:**

- **Use centralized config** from `party/lib/config.ts` for all environment variables
- **Don't duplicate environment logic** across files
- **Use helper functions** for URL construction

```typescript
// ✅ Correct - Use centralized config
import { getLobbyUrl } from './lib/config';
const lobbyUrl = getLobbyUrl('/register');

// ❌ Incorrect - Duplicate env logic
const host = process.env.PARTYKIT_HOST || 'http://127.0.0.1:1999';
const lobbyUrl = `${host}/register`;
```

## Code Standards

### Imports (IMPORTANT)

- **Always use alias paths** (`$shared/`, `$lib/`) instead of relative paths
- **Never use file extensions** in imports (`.js`, `.ts`, etc.)
- **Import types with `import type`** for type-only imports
- **Use centralized exports** - import from `$lib` instead of deep imports where possible

**Examples:**

```typescript
// ✅ Correct
import { Poll, VoteMessage } from '$shared/schemas';
import type { Poll } from '$lib/types';
import { useWebSocket } from '$lib';

// ❌ Incorrect
import { Poll } from '../shared/schemas/index.js';
import { Poll } from '../../shared/schemas/poll.ts';
import { useWebSocket } from './hooks/useWebSocket.svelte';
```

### Frontend (IMPORTANT)

- **Always use Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- **Prioritize component composition** - build hierarchical, reusable components
- Never use Svelte 4 patterns (stores, reactive statements)

### Backend (IMPORTANT)

- **Always use hooks from `party/lib/hooks.ts`** for WebSocket/storage operations
- **Never use direct `room.storage.put()` or `room.broadcast()`** - use hooks instead
- **Extend `PartyKitServer`** class for consistent structure
- **Keep business logic in `handlers.ts`**, use hooks for plumbing
- **Use centralized config** from `party/lib/config.ts` for environment variables
- **Use common utilities** from `party/utils.ts` for shared logic

**Examples:**

```typescript
// ✅ Correct - Use hooks
const storage = useStorage<{ poll: Poll }>(room);
const { broadcast } = useBroadcast<PollUpdateMessage>(room);
const { success, error } = useHttpResponse();

await storage.set('poll', poll);
broadcast(updateMessage);
return success(data);

// ❌ Incorrect - Direct usage
await room.storage.put('poll', poll);
room.broadcast(JSON.stringify(updateMessage));
return new Response(JSON.stringify(data));
```

### Backend Patterns

```typescript
// Message handling - auto-validates and routes
const messageHandler = useMessageHandler(MessageSchema, room);
messageHandler.handle('vote', async (msg, sender) => {
	// Type-safe message handling
});

// Broadcasting - auto-serializes
const { send, broadcast } = useBroadcast<MessageType>(room);
broadcast(message);

// Storage - type-safe operations
const storage = useStorage<{ poll: Poll }>(room);
await storage.set('poll', pollData);
```

### Validation (IMPORTANT)

- **Always validate with Zod** - use `MessageSchema.parse()` for all external data
- **Use validated schemas in responses** - don't validate and then ignore the result
- **Return typed error responses** with proper status codes using hooks

**Examples:**

```typescript
// ✅ Correct - Use validated response
const errorResponse = ApiErrorResponseSchema.parse({
    error: 'registration_failed',
    message: 'Failed to register room'
});
return this.http.error(errorResponse.message, 500);

// ❌ Incorrect - Validate but ignore result
const errorResponse = ApiErrorResponseSchema.parse({...});
return this.http.error('Hard-coded message', 500);
```

### State Management

- **PartyKit**: Room storage (persistent game/poll state)
- **Frontend**: Svelte 5 runes in `src/lib/stores/` (no legacy stores)
- **Player State**: localStorage for player ID, avatar, and vote tracking
- **Avatar State**: Deterministic generation with customization persistence

### Testing Strategy

- **Schema Validation**: Comprehensive Zod tests for all schemas (poll, game, player, story)
- **WebSocket Testing**: Mock connections with lifecycle simulation
- **Backend Logic**: Test with mocked PartyKit rooms and storage
- **Component Testing**: Test component composition and Svelte 5 runes
- **Import Consistency**: All tests must use `$shared/` aliases, never relative imports

## Code Quality Tools

### Linting and Quality Checks

**Available Scripts:**
```bash
npm run quality:check      # Run all quality checks (lint, type-check, svelte-check)
npm run quality:complexity # Analyze code complexity with threshold warnings
npm run lint:check         # ESLint validation
npm run lint:fix           # Auto-fix ESLint issues
npm run type-check         # TypeScript validation without emit
```

**ESLint Configuration:**
- TypeScript and Svelte support with strict rules
- Enforces consistent type imports (`import type` for types)
- Prevents file extensions in imports
- Validates import patterns and alias usage

### Component Composition Patterns

**Hierarchical Component Structure:**
```typescript
// ✅ Correct - Compose larger components from smaller ones
export { AvatarSelector, PlayerAvatar, GameAvatar } from './avatar';
export { TitleHeader, ErrorPage } from './layout';
export { PlayerProfileModal, AdvancedOptionsModal } from './modals';

// Use in parent components
import { AvatarSelector, TitleHeader } from '$lib/components';
```

**Svelte 5 Runes Best Practices:**
```typescript
// ✅ Correct - Reactive state management
let player = $state<Player>({ id: '', name: '', avatar: null });
let isConnected = $derived(websocket?.readyState === WebSocket.OPEN);

$effect(() => {
    if (player.id) {
        localStorage.setItem('playerId', player.id);
    }
});

// ❌ Incorrect - Legacy Svelte 4 patterns
let player; // Use $state instead
$: isConnected = websocket?.readyState === WebSocket.OPEN; // Use $derived
```

### Import Troubleshooting

**Common Issues and Solutions:**

1. **File Extension Errors:**
```typescript
// ❌ Error: Cannot find module '../schemas/index.js'
import { Schema } from '../schemas/index.js';

// ✅ Solution: Remove extension
import { Schema } from '../schemas/index';
```

2. **Alias Resolution Issues:**
```typescript
// ❌ Error: Cannot resolve '$shared/schemas'
// Check vite.config.ts and svelte.config.js for alias configuration

// ✅ Solution: Verify aliases are configured
// vite.config.ts: alias: { $shared: resolve('./shared') }
// svelte.config.js: alias: { $shared: './shared' }
```

3. **Test Import Issues:**
```typescript
// ❌ Incorrect - Relative imports in tests
import { Schema } from '../../shared/schemas/poll';

// ✅ Correct - Use aliases in tests
import { Schema } from '$shared/schemas/poll';
```

### Error Handling Patterns

**WebSocket Error Handling:**
```typescript
// ✅ Correct - Comprehensive error handling
const websocket = $state<WebSocket | null>(null);
const connectionError = $state<string | null>(null);

$effect(() => {
    try {
        const ws = new WebSocket(url);
        ws.onerror = () => connectionError = 'Failed to connect to server';
        ws.onclose = () => connectionError = 'Connection lost';
        websocket = ws;
    } catch (error) {
        connectionError = error instanceof Error ? error.message : 'Unknown error';
    }
});
```

**Component Error Boundaries:**
```typescript
// ✅ Correct - Error page component usage
{#if error}
    <ErrorPage 
        title="Connection Failed"
        message={error}
        showRetry={true}
        onRetry={() => location.reload()}
    />
{:else}
    <!-- Normal component content -->
{/if}
```

## Performance Optimization

### Bundle Size Optimization
- Use `import type` for type-only imports to reduce bundle size
- Leverage centralized exports from `$lib` and `$shared`
- Tree-shaking optimized with proper ES module structure

### WebSocket Performance
- Single WebSocket connection per page with message routing
- Efficient state updates using Svelte 5 runes
- Proper cleanup in `$effect` cleanup functions
