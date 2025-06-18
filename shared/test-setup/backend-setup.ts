import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database'

// Global test setup for backend tests
beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await cleanupTestDatabase()
})

beforeEach(async () => {
  // Clean all tables before each test - this will be handled by individual tests
})

afterEach(async () => {
  // Additional cleanup if needed
})

// Suppress console.log during tests (optional)
if (process.env.NODE_ENV === 'test') {
  const originalConsoleLog = console.log
  console.log = (...args: any[]) => {
    // Only log if explicitly needed in tests
    if (args[0]?.includes('[TEST]')) {
      originalConsoleLog(...args)
    }
  }
}