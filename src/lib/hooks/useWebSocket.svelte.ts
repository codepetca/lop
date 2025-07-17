import { browser } from '$app/environment';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	onOpen?: () => void;
	onClose?: () => void;
	onError?: (error: Event) => void;
}

export function useWebSocket<TMessage = any, TSendMessage = any>(
	partyType: string,
	roomId: string,
	options: UseWebSocketOptions = {}
) {
	const { reconnectInterval = 3000, maxReconnectAttempts = 5, onOpen, onClose, onError } = options;

	let socket: WebSocket | null = null;
	let reconnectAttempts = 0;
	let reconnectTimeoutId: number | null = null;

	// Reactive state using runes
	let status = $state<WebSocketStatus>('disconnected');
	let lastMessage = $state<TMessage | null>(null);

	// Derived state for connection status
	const isConnected = $derived(status === 'connected');

	function getWebSocketUrl(): string {
		if (!browser) return '';

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		return `${protocol}//${PUBLIC_PARTYKIT_HOST}/parties/${partyType}/${roomId}`;
	}

	function connect() {
		if (!browser || socket?.readyState === WebSocket.OPEN) return;

		disconnect(); // Clean up any existing connection

		status = 'connecting';

		try {
			const wsUrl = getWebSocketUrl();
			socket = new WebSocket(wsUrl);

			socket.onopen = () => {
				status = 'connected';
				reconnectAttempts = 0;
				onOpen?.();
			};

			socket.onmessage = (event) => {
				try {
					const message: TMessage = JSON.parse(event.data);
					lastMessage = message;
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			socket.onclose = () => {
				status = 'disconnected';
				socket = null;
				onClose?.();

				// Attempt reconnection if within limits
				if (reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					reconnectTimeoutId = window.setTimeout(connect, reconnectInterval);
				}
			};

			socket.onerror = (error) => {
				status = 'error';
				onError?.(error);
				console.error('WebSocket error:', error);
			};
		} catch (error) {
			status = 'error';
			console.error('Failed to create WebSocket connection:', error);
		}
	}

	function disconnect() {
		if (reconnectTimeoutId) {
			clearTimeout(reconnectTimeoutId);
			reconnectTimeoutId = null;
		}

		if (socket) {
			socket.close();
			socket = null;
		}

		status = 'disconnected';
	}

	function send(message: TSendMessage) {
		if (socket?.readyState === WebSocket.OPEN) {
			try {
				socket.send(JSON.stringify(message));
			} catch (error) {
				console.error('Failed to send WebSocket message:', error);
			}
		} else {
			console.warn('WebSocket is not connected. Cannot send message:', message);
		}
	}

	// Auto-cleanup function to be called in onDestroy
	function cleanup() {
		disconnect();
	}

	// Return the hook interface with getters for reactive state
	return {
		get status() {
			return status;
		},
		get lastMessage() {
			return lastMessage;
		},
		get isConnected() {
			return isConnected;
		},
		send,
		connect,
		disconnect,
		cleanup
	};
}
