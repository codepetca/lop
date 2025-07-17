import { vi } from 'vitest';
import type { Poll } from '../../shared/schemas/message';

/**
 * Reusable mock helpers for PartyKit and WebSocket
 */

// Mock PartyKit Room
export const createMockRoom = () => {
	const storage = new Map();
	const connections = new Set();
	
	return {
		id: 'test-room',
		storage: {
			get: vi.fn().mockImplementation((key: string) => Promise.resolve(storage.get(key))),
			put: vi.fn().mockImplementation((key: string, value: any) => {
				storage.set(key, value);
				return Promise.resolve();
			}),
			delete: vi.fn().mockImplementation((key: string) => {
				storage.delete(key);
				return Promise.resolve();
			}),
			list: vi.fn().mockImplementation(() => Promise.resolve(new Map(storage)))
		},
		broadcast: vi.fn(),
		context: {
			parties: {
				poll: {
					get: vi.fn().mockReturnValue({
						fetch: vi.fn().mockResolvedValue({
							ok: true,
							json: vi.fn().mockResolvedValue({
								success: true,
								poll: { id: 'test-poll', title: 'Test', options: ['A', 'B'], votes: { A: 0, B: 0 } }
							})
						})
					})
				}
			}
		},
		// Helper methods for testing
		_setStorageItem: (key: string, value: any) => storage.set(key, value),
		_getStorageItem: (key: string) => storage.get(key),
		_clearStorage: () => storage.clear(),
		_getConnections: () => connections
	};
};

// Mock PartyKit Connection
export const createMockConnection = (id = 'test-connection') => ({
	id,
	send: vi.fn(),
	close: vi.fn(),
	readyState: 1 // WebSocket.OPEN
});

// Mock WebSocket
export const createMockWebSocket = () => {
	const socket = {
		readyState: 1, // WebSocket.OPEN
		send: vi.fn(),
		close: vi.fn(),
		onopen: null as ((event: Event) => void) | null,
		onmessage: null as ((event: MessageEvent) => void) | null,
		onclose: null as ((event: CloseEvent) => void) | null,
		onerror: null as ((event: Event) => void) | null,
		
		// Helper methods for testing
		_triggerOpen: () => {
			if (socket.onopen) socket.onopen(new Event('open'));
		},
		_triggerMessage: (data: any) => {
			if (socket.onmessage) {
				socket.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
			}
		},
		_triggerClose: () => {
			if (socket.onclose) socket.onclose(new CloseEvent('close'));
		},
		_triggerError: () => {
			if (socket.onerror) socket.onerror(new Event('error'));
		}
	};
	
	return socket;
};

// Mock fetch for API calls
export const createMockFetch = (responses: Record<string, any> = {}) => {
	return vi.fn().mockImplementation((url: string | URL, options?: RequestInit) => {
		const urlStr = typeof url === 'string' ? url : url.toString();
		const response = responses[urlStr] || { ok: true, json: () => Promise.resolve({}) };
		
		return Promise.resolve({
			ok: response.ok || true,
			status: response.status || 200,
			json: vi.fn().mockResolvedValue(response.data || {}),
			text: vi.fn().mockResolvedValue(response.text || ''),
			...response
		});
	});
};

// Mock environment variables
export const mockEnv = (env: Record<string, string> = {}) => {
	const originalEnv = process.env;
	
	beforeEach(() => {
		process.env = { ...originalEnv, ...env };
	});
	
	afterEach(() => {
		process.env = originalEnv;
	});
};

// Helper to create test polls with vote counts
export const createPollWithVotes = (votes: Record<string, number>): Poll => ({
	id: 'test-poll-with-votes',
	title: 'Test Poll',
	options: Object.keys(votes),
	votes
});