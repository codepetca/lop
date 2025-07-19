import { browser } from '$app/environment';
import { PUBLIC_PARTYKIT_HOST } from '$env/static/public';
import { MessageSchema } from '$shared/schemas/index';

export type WebSocketStatus =
	| 'connecting'
	| 'connected'
	| 'disconnected'
	| 'error'
	| 'server-unavailable';

interface UseWebSocketOptions {
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	onOpen?: () => void;
	onClose?: () => void;
	onError?: (error: Event) => void;
	onServerUnavailable?: () => void;
}

export function useWebSocket<TMessage = any, TSendMessage = any>(
	partyType: string,
	roomId: string,
	options: UseWebSocketOptions = {}
) {
	const {
		reconnectInterval = 3000,
		maxReconnectAttempts = 5,
		onOpen,
		onClose,
		onError,
		onServerUnavailable
	} = options;

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
					const rawMessage = JSON.parse(event.data);
					const validatedMessage = MessageSchema.parse(rawMessage);
					lastMessage = validatedMessage as TMessage;
				} catch (error) {
					console.error('Error parsing or validating WebSocket message:', error);
					console.error('Raw message that failed validation:', event.data);
				}
			};

			socket.onclose = (event) => {
				status = 'disconnected';
				socket = null;
				onClose?.();

				// Check if this looks like a server unavailable scenario
				if (event.code === 1006 || event.code === 1001) {
					// WebSocket closed abnormally or server going away
					if (reconnectAttempts >= maxReconnectAttempts) {
						status = 'server-unavailable';
						onServerUnavailable?.();
						return;
					}
				}

				// Attempt reconnection if within limits
				if (reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					reconnectTimeoutId = window.setTimeout(connect, reconnectInterval);
				} else {
					status = 'server-unavailable';
					onServerUnavailable?.();
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

	// Retry connection (useful for manual retries)
	function retry() {
		reconnectAttempts = 0; // Reset attempts
		status = 'disconnected';
		connect();
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
		get reconnectAttempts() {
			return reconnectAttempts;
		},
		get maxReconnectAttempts() {
			return maxReconnectAttempts;
		},
		send,
		connect,
		disconnect,
		cleanup,
		retry
	};
}
