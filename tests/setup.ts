import { vi } from 'vitest';

// Mock browser environment for tests
Object.defineProperty(global, 'WebSocket', {
	value: vi.fn(),
	writable: true
});

// Mock window object
Object.defineProperty(global, 'window', {
	value: {
		location: {
			protocol: 'http:',
			host: 'localhost:5173'
		}
	},
	writable: true
});

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock navigator.clipboard
Object.defineProperty(global, 'navigator', {
	value: {
		clipboard: {
			writeText: vi.fn().mockResolvedValue(undefined)
		}
	},
	writable: true
});

// Export mocks for reuse in tests
export { localStorageMock };