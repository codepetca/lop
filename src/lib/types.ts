import type { AvatarConfig } from '$shared/schemas/player';

// Frontend-specific types
export interface Player {
	id: string;
	name: string;
	isGenerated: boolean;
	createdAt: number;
	avatar: AvatarConfig;
}

// Re-export shared types for frontend use
export type {
	Poll,
	PollPlayer,
	VoteMessage,
	PollUpdateMessage,
	PlayerJoinPollMessage,
	PlayerJoinedPollMessage,
	RoomMetadata,
	RoomListRequestMessage,
	RoomListMessage,
	Message,
	CreatePollResponse,
	GetPollResponse,
	RegisterRoomResponse,
	ApiErrorResponse,
	// Game-related types
	GameSession,
	GameMetadata,
	GameListRequestMessage,
	GameListMessage,
	GameChoiceMessage,
	GameUpdateMessage,
	PlayerJoinMessage,
	PlayerJoinedMessage,
	PlayerLeftMessage,
	VotingStartedMessage,
	VotingEndedMessage,
	SceneTransitionMessage,
	GameCompletedMessage,
	GameErrorMessage,
	CharacterState,
	StoryChoice,
	StoryScene,
	StoryTemplate,
	VoteResult,
	CreateGameResponse,
	GetGameResponse,
	GetStoriesResponse,
	JoinGameResponse
} from '$shared/schemas';
