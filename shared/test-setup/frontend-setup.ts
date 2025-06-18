import { beforeAll, afterAll, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock global WebSocket for frontend tests
class MockWebSocket {
  readyState = 1 // OPEN
  url = ''
  
  constructor(url: string) {
    this.url = url
  }
  
  send(data: string) {
    // Mock implementation
  }
  
  close() {
    // Mock implementation
  }
  
  addEventListener(event: string, callback: Function) {
    // Mock implementation
  }
  
  removeEventListener(event: string, callback: Function) {
    // Mock implementation
  }
}

// Global test setup for frontend tests
beforeAll(() => {
  // Mock WebSocket globally
  global.WebSocket = MockWebSocket as any
  
  // Mock fetch if needed
  global.fetch = vi.fn()
  
  // Mock environment variables
  vi.stubEnv('VITE_COLYSEUS_URL', 'ws://localhost:2567')
  vi.stubEnv('VITE_API_URL', 'http://localhost:2567')
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Cleanup
  vi.restoreAllMocks()
})