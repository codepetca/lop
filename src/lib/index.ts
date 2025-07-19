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

// Re-export store for app-wide state management
export { store } from './stores';

// Re-export avatar utilities
export * from './avatar/utils';

// Re-export components
export { default as PlayerAvatar } from './components/PlayerAvatar.svelte';
export { default as PlayerProfileModal } from './components/PlayerProfileModal.svelte';
export { default as AvatarSelector } from './components/AvatarSelector.svelte';
export { default as TitleHeader } from './components/TitleHeader.svelte';
export { default as AdvancedOptionsModal } from './components/AdvancedOptionsModal.svelte';
export { default as GameAvatar } from './components/GameAvatar.svelte';
export { default as ErrorPage } from './components/ErrorPage.svelte';
export { default as GameCardSkeleton } from './components/GameCardSkeleton.svelte';

// Re-export game components
export { default as InteractiveScene } from './components/game/InteractiveScene.svelte';
export { default as ImageTarget } from './components/game/ImageTarget.svelte';
export { default as BackgroundScene } from './components/game/BackgroundScene.svelte';
export { default as VotingFallback } from './components/game/VotingFallback.svelte';
