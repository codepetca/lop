# Testing Guide

Comprehensive testing strategy for the Multiplayer Choose-Your-Own-Adventure Game using Vitest and Playwright.

## Test Architecture

### Unified Vitest Workspace
- **Backend Tests**: Node.js environment with in-memory SQLite
- **Frontend Tests**: jsdom environment with Svelte testing utilities
- **Shared Utilities**: Common test helpers and fixtures
- **E2E Tests**: Playwright for full user journey testing

## Test Categories

### 🏗️ **Unit Tests**

#### Backend Unit Tests
```bash
npm run test:backend
```

**Coverage:**
- Database queries (`src/database/__tests__/`)
- Game room logic (`src/rooms/__tests__/`)
- Business logic and utilities

**Technologies:**
- Vitest with Node.js environment
- In-memory SQLite for database testing
- Mock Colyseus framework

#### Frontend Unit Tests
```bash
npm run test:frontend
```

**Coverage:**
- Svelte 5 stores and runes (`src/lib/stores/__tests__/`)
- Component logic and rendering (`src/lib/components/__tests__/`)
- Utility functions and helpers

**Technologies:**
- Vitest with jsdom environment
- @testing-library/svelte for component testing
- Mock Colyseus client

### 🔗 **Integration Tests**

#### Backend Integration Tests
- Colyseus room lifecycle testing
- WebSocket message handling
- Database + game logic integration
- Campaign and scene workflow testing

#### Frontend Integration Tests
- Colyseus client integration
- Real-time state synchronization
- Component interaction workflows
- Route navigation and state persistence

### 🎭 **End-to-End Tests**
```bash
npm run test:e2e
```

**Coverage:**
- Complete multiplayer game flow
- Cross-browser compatibility
- Mobile responsiveness
- Real-time voting mechanics
- Scene transitions and timer functionality

**Technologies:**
- Playwright with Chromium, Firefox, WebKit
- Multi-tab testing for multiplayer scenarios
- Mobile device simulation

## Running Tests

### All Tests
```bash
npm test                    # Run all tests once
npm run test:watch          # Run all tests in watch mode
npm run test:coverage       # Run with coverage report
npm run test:ui             # Open Vitest UI
```

### Specific Test Suites
```bash
npm run test:backend        # Backend tests only
npm run test:frontend       # Frontend tests only
npm run test:shared         # Shared utilities tests
npm run test:e2e            # E2E tests only
npm run test:e2e:ui         # E2E tests with UI
```

### Watch Mode (Development)
```bash
npm run test:backend:watch  # Backend tests in watch mode
npm run test:frontend:watch # Frontend tests in watch mode
```

## Test Data & Fixtures

### Shared Test Data
Located in `shared/fixtures/`:
- `campaigns.ts` - Sample campaigns, scenes, and targets
- Consistent test data across all test suites
- Realistic game scenarios and edge cases

### Test Database
- In-memory SQLite for fast, isolated tests
- Automatic setup/teardown for each test
- Type-safe queries with Kysely

### Mock Services
Located in `shared/mocks/`:
- `colyseus.ts` - Mock Colyseus client and rooms
- WebSocket simulation for frontend tests
- Real-time message simulation

## Test Utilities

### Shared Helpers
Located in `shared/utils/`:
- `test-database.ts` - Database setup and utilities
- `test-helpers.ts` - Common test functions
- Data seeding and cleanup utilities
- Console mocking and assertion helpers

### Custom Matchers
Extended expect matchers for:
- Database state assertions
- Game state validations
- Scene and target validations

## Coverage Requirements

### Target Coverage
- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

### Coverage Reports
```bash
npm run test:coverage       # Generate coverage report
```

Reports generated in:
- `coverage/backend/` - Backend coverage
- `coverage/frontend/` - Frontend coverage
- `coverage/shared/` - Shared utilities coverage

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Pre-commit Hooks
```bash
# Recommended pre-commit hook
npm run test && npm run lint && npm run typecheck
```

## Test Development Guidelines

### Writing Good Tests

#### ✅ **Do:**
- Use descriptive test names that explain the behavior
- Test behavior, not implementation details
- Use proper setup/teardown for isolated tests
- Mock external dependencies appropriately
- Test edge cases and error conditions

#### ❌ **Don't:**
- Test internal implementation details
- Create tests that depend on other tests
- Mock everything (test real integrations when possible)
- Ignore failing tests or skip them without good reason

### Test Organization
```
backend/src/
├── database/
│   ├── __tests__/
│   │   └── queries.test.ts
│   └── queries.ts
└── rooms/
    ├── __tests__/
    │   └── GameRoom.test.ts
    └── GameRoom.ts

frontend/src/lib/
├── stores/
│   ├── __tests__/
│   │   └── game.test.ts
│   └── game.svelte.ts
└── components/
    ├── __tests__/
    │   └── GameScene.test.ts
    └── GameScene.svelte
```

### Testing Patterns

#### Database Testing
```typescript
beforeEach(async () => {
  await clearTestData()
  await seedTestData()
})

it('should return campaign by ID', async () => {
  const campaign = await getCampaign('test-campaign-1')
  expect(campaign?.title).toBe('Test Forest Quest')
})
```

#### Component Testing
```typescript
it('should display scene title', async () => {
  const mockScene = { title: 'Test Scene', /* ... */ }
  gameStore.setCurrentScene(mockScene)
  
  render(GameScene)
  expect(screen.getByText('Test Scene')).toBeInTheDocument()
})
```

#### E2E Testing
```typescript
test('should complete voting flow', async ({ page, context }) => {
  // Set up multiple players
  const player2 = await context.newPage()
  
  // Both players join and vote
  await page.click('button:has-text("Go Left")')
  await player2.click('button:has-text("Go Right")')
  
  // Verify results
  await expect(page.getByText('Processing votes')).toBeVisible()
})
```

## Debugging Tests

### Debug Commands
```bash
npm run test:ui             # Visual test debugging
npm run test:e2e:ui         # E2E test debugging
```

### Debug Tips
- Use `test.only()` to run specific tests
- Add `console.log()` statements (they'll show in test output)
- Use browser dev tools in E2E tests with `--headed` flag
- Check test database state with helper functions

## Performance Testing

### Load Testing (Future)
- Multiple concurrent players (30+)
- Real-time voting under load
- Database performance with large datasets
- WebSocket connection limits

### Metrics to Monitor
- Test execution time
- Memory usage during tests
- Database query performance
- WebSocket message latency

## Troubleshooting

### Common Issues

#### "Database not initialized"
- Ensure test setup runs before tests
- Check that `setupTestDatabase()` is called

#### "WebSocket connection failed"
- Verify mock WebSocket is properly configured
- Check that frontend setup includes WebSocket mocks

#### "Component not found"
- Ensure Svelte plugin is configured correctly
- Check import paths and aliases

#### E2E tests timing out
- Increase timeout for slow operations
- Add proper wait conditions
- Check that both servers are running

### Getting Help
- Check test logs in `npm test` output
- Use `--reporter=verbose` for detailed test information
- Review coverage reports to identify untested code paths