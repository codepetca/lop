// Centralized frontend exports - single source of truth for all frontend types and utilities

// Re-export all types for consistent frontend usage
export type {
	Poll,
	VoteMessage,
	PollUpdateMessage,
	RoomMetadata,
	RoomListRequestMessage,
	RoomListMessage,
	Message,
	CreatePollResponse,
	GetPollResponse,
	RegisterRoomResponse,
	ApiErrorResponse
} from './types';

// Re-export WebSocket hook for easy access
export { useWebSocket } from './hooks/useWebSocket.svelte';
