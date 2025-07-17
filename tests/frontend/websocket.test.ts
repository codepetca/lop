import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockWebSocket } from '../utils/mocks';
import { createVoteMessage, createPollUpdateMessage } from '../utils/fixtures';

// Mock the browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$env/static/public', () => ({
	PUBLIC_PARTYKIT_HOST: 'localhost:1999'
}));

// Mock the MessageSchema to always pass validation
vi.mock('../../shared/schemas/index', () => ({
	MessageSchema: {
		parse: vi.fn().mockImplementation((data) => data)
	}
}));

describe('WebSocket Hook', () => {
	let mockWebSocket: ReturnType<typeof createMockWebSocket>;
	let useWebSocket: any;
	let WebSocketSpy: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockWebSocket = createMockWebSocket();
		WebSocketSpy = vi.fn().mockImplementation(() => mockWebSocket);
		global.WebSocket = WebSocketSpy;
		
		// Mock window.location for getWebSocketUrl
		Object.defineProperty(global, 'window', {
			value: {
				location: {
					protocol: 'http:'
				},
				setTimeout: vi.fn().mockImplementation((callback, delay) => {
					setTimeout(callback, delay);
					return 123; // Return a fake timeout ID
				})
			},
			writable: true
		});

		// Mock WebSocket constants
		Object.defineProperty(global, 'WebSocket', {
			value: WebSocketSpy,
			writable: true
		});

		// Add WebSocket constants
		WebSocketSpy.CONNECTING = 0;
		WebSocketSpy.OPEN = 1;
		WebSocketSpy.CLOSING = 2;
		WebSocketSpy.CLOSED = 3;
		global.WebSocket.CONNECTING = 0;
		global.WebSocket.OPEN = 1;
		global.WebSocket.CLOSING = 2;
		global.WebSocket.CLOSED = 3;
		
		// Dynamically import to ensure mocks are applied
		const module = await import('../../src/lib/hooks/useWebSocket.svelte');
		useWebSocket = module.useWebSocket;
	});

	describe('useWebSocket', () => {
		it('should create WebSocket connection', () => {
			const ws = useWebSocket('poll', 'test-room');
			
			// Verify initial state
			expect(ws.status).toBe('disconnected');
			expect(ws.isConnected).toBe(false);
			
			// Call connect
			ws.connect();

			// Verify WebSocket was created
			expect(WebSocketSpy).toHaveBeenCalledWith('ws://localhost:1999/parties/poll/test-room');
			expect(ws.status).toBe('connecting');
		});

		it('should handle connection lifecycle', () => {
			const ws = useWebSocket('poll', 'test-room');
			
			// Initial state
			expect(ws.status).toBe('disconnected');
			expect(ws.isConnected).toBe(false);
			
			// Connect
			ws.connect();
			expect(ws.status).toBe('connecting');
			
			// Simulate connection open
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}
			expect(ws.status).toBe('connected');
			expect(ws.isConnected).toBe(true);
			
			// Simulate disconnection
			if (mockWebSocket.onclose) {
				mockWebSocket.onclose(new CloseEvent('close'));
			}
			expect(ws.status).toBe('disconnected');
			expect(ws.isConnected).toBe(false);
		});

		it('should handle messages', () => {
			const ws = useWebSocket('poll', 'test-room');
			ws.connect();
			
			const testMessage = createPollUpdateMessage();
			
			// Simulate receiving a message
			if (mockWebSocket.onmessage) {
				mockWebSocket.onmessage(new MessageEvent('message', { 
					data: JSON.stringify(testMessage) 
				}));
			}
			
			expect(ws.lastMessage).toEqual(testMessage);
		});

		it('should send messages when connected', () => {
			const ws = useWebSocket('poll', 'test-room');
			ws.connect();
			
			// Simulate connection open to properly set up the socket
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}
			
			// Set socket to connected state
			mockWebSocket.readyState = 1; // WebSocket.OPEN
			
			const message = createVoteMessage();
			ws.send(message);
			
			expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
		});

		it('should handle connection errors', () => {
			const onError = vi.fn();
			const ws = useWebSocket('poll', 'test-room', { onError });
			
			ws.connect();
			
			// Simulate error
			if (mockWebSocket.onerror) {
				mockWebSocket.onerror(new Event('error'));
			}
			
			expect(ws.status).toBe('error');
			expect(onError).toHaveBeenCalled();
		});

		it('should call lifecycle callbacks', () => {
			const onOpen = vi.fn();
			const onClose = vi.fn();
			const ws = useWebSocket('poll', 'test-room', { onOpen, onClose });
			
			ws.connect();
			
			// Simulate connection open
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}
			expect(onOpen).toHaveBeenCalled();
			
			// Simulate connection close
			if (mockWebSocket.onclose) {
				mockWebSocket.onclose(new CloseEvent('close'));
			}
			expect(onClose).toHaveBeenCalled();
		});

		it('should disconnect properly', () => {
			const ws = useWebSocket('poll', 'test-room');
			ws.connect();
			
			// Simulate connection open
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}
			
			ws.disconnect();
			
			expect(mockWebSocket.close).toHaveBeenCalled();
			expect(ws.status).toBe('disconnected');
		});

		it('should cleanup connections', () => {
			const ws = useWebSocket('poll', 'test-room');
			ws.connect();
			
			// Simulate connection open
			if (mockWebSocket.onopen) {
				mockWebSocket.onopen(new Event('open'));
			}
			
			ws.cleanup();
			
			expect(mockWebSocket.close).toHaveBeenCalled();
		});

		it('should not create connection in non-browser environment', async () => {
			// Clear the previous spy calls
			WebSocketSpy.mockClear();
			
			// Mock non-browser environment - this test verifies the browser check works
			// by temporarily overriding the browser environment
			vi.resetModules();
			vi.doMock('$app/environment', () => ({
				browser: false
			}));
			
			// Re-import with new mock - the module cache is cleared
			const { useWebSocket: useWebSocketNonBrowser } = await import('../../src/lib/hooks/useWebSocket.svelte');
			
			const ws = useWebSocketNonBrowser('poll', 'test-room');
			ws.connect();
			
			expect(WebSocketSpy).not.toHaveBeenCalled();
		});
	});
});