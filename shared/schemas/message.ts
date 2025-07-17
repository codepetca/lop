import { z } from 'zod';
import { PollSchema } from './poll';
import {
	GameSessionSchema,
	GameMetadataSchema,
	StoryChoiceSchema,
	CharacterStateSchema,
	VoteResultSchema
} from './game';

// Vote message schema
export const VoteMessageSchema = z.object({
	type: z.literal('vote'),
	option: z.string(),
	playerId: z.string().uuid()
});

// Player join poll message schema
export const PlayerJoinPollMessageSchema = z.object({
	type: z.literal('player-join-poll'),
	playerName: z.string().min(1).optional(), // Optional - will generate if not provided
	playerId: z.string().uuid().optional() // Optional - will generate if not provided
});

// Player joined poll message schema (broadcast to all)
export const PlayerJoinedPollMessageSchema = z.object({
	type: z.literal('player-joined-poll'),
	player: z.object({
		id: z.string().uuid(),
		name: z.string(),
		joinedAt: z.string()
	})
});

// Poll update message schema
export const PollUpdateMessageSchema = z.object({
	type: z.literal('poll-update'),
	poll: PollSchema
});

// Room metadata schema for lobby (legacy poll support)
export const RoomMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	createdAt: z.string(),
	activeConnections: z.number().default(0),
	totalVotes: z.number().default(0)
});

// Game-specific message schemas
export const GameChoiceMessageSchema = z.object({
	type: z.literal('game-choice'),
	choiceId: z.string(),
	playerId: z.string().optional() // for player identification
});

export const GameUpdateMessageSchema = z.object({
	type: z.literal('game-update'),
	game: GameSessionSchema
});

export const GameListRequestMessageSchema = z.object({
	type: z.literal('game-list-request')
});

export const GameListMessageSchema = z.object({
	type: z.literal('game-list'),
	games: z.array(GameMetadataSchema)
});

export const PlayerJoinMessageSchema = z.object({
	type: z.literal('player-join'),
	playerName: z.string().min(1),
	playerId: z.string().optional()
});

export const PlayerJoinedMessageSchema = z.object({
	type: z.literal('player-joined'),
	player: CharacterStateSchema
});

export const PlayerLeftMessageSchema = z.object({
	type: z.literal('player-left'),
	playerId: z.string()
});

export const VotingStartedMessageSchema = z.object({
	type: z.literal('voting-started'),
	choices: z.array(StoryChoiceSchema),
	timeLimit: z.number(), // seconds
	endsAt: z.string() // ISO timestamp
});

export const VotingEndedMessageSchema = z.object({
	type: z.literal('voting-ended'),
	result: VoteResultSchema
});

export const SceneTransitionMessageSchema = z.object({
	type: z.literal('scene-transition'),
	currentScene: z.string(),
	title: z.string(),
	description: z.string(),
	isEnding: z.boolean().default(false)
});

export const GameCompletedMessageSchema = z.object({
	type: z.literal('game-completed'),
	finalStats: z.record(z.string(), z.number()).default({})
});

export const GameErrorMessageSchema = z.object({
	type: z.literal('game-error'),
	error: z.string(),
	message: z.string().optional()
});

// Room list request message schema
export const RoomListRequestMessageSchema = z.object({
	type: z.literal('room-list-request')
});

// Room list message schema
export const RoomListMessageSchema = z.object({
	type: z.literal('room-list'),
	rooms: z.array(RoomMetadataSchema)
});

// Union of all WebSocket message types
export const MessageSchema = z.discriminatedUnion('type', [
	// Poll messages
	VoteMessageSchema,
	PollUpdateMessageSchema,
	PlayerJoinPollMessageSchema,
	PlayerJoinedPollMessageSchema,
	RoomListRequestMessageSchema,
	RoomListMessageSchema,
	// Game messages
	GameChoiceMessageSchema,
	GameUpdateMessageSchema,
	GameListRequestMessageSchema,
	GameListMessageSchema,
	PlayerJoinMessageSchema,
	PlayerJoinedMessageSchema,
	PlayerLeftMessageSchema,
	VotingStartedMessageSchema,
	VotingEndedMessageSchema,
	SceneTransitionMessageSchema,
	GameCompletedMessageSchema,
	GameErrorMessageSchema
]);

// Export TypeScript types inferred from schemas
export type VoteMessage = z.infer<typeof VoteMessageSchema>;
export type PollUpdateMessage = z.infer<typeof PollUpdateMessageSchema>;
export type PlayerJoinPollMessage = z.infer<typeof PlayerJoinPollMessageSchema>;
export type PlayerJoinedPollMessage = z.infer<typeof PlayerJoinedPollMessageSchema>;
export type RoomMetadata = z.infer<typeof RoomMetadataSchema>;
export type RoomListRequestMessage = z.infer<typeof RoomListRequestMessageSchema>;
export type RoomListMessage = z.infer<typeof RoomListMessageSchema>;

// Game message types
export type GameChoiceMessage = z.infer<typeof GameChoiceMessageSchema>;
export type GameUpdateMessage = z.infer<typeof GameUpdateMessageSchema>;
export type GameListRequestMessage = z.infer<typeof GameListRequestMessageSchema>;
export type GameListMessage = z.infer<typeof GameListMessageSchema>;
export type PlayerJoinMessage = z.infer<typeof PlayerJoinMessageSchema>;
export type PlayerJoinedMessage = z.infer<typeof PlayerJoinedMessageSchema>;
export type PlayerLeftMessage = z.infer<typeof PlayerLeftMessageSchema>;
export type VotingStartedMessage = z.infer<typeof VotingStartedMessageSchema>;
export type VotingEndedMessage = z.infer<typeof VotingEndedMessageSchema>;
export type SceneTransitionMessage = z.infer<typeof SceneTransitionMessageSchema>;
export type GameCompletedMessage = z.infer<typeof GameCompletedMessageSchema>;
export type GameErrorMessage = z.infer<typeof GameErrorMessageSchema>;

export type Message = z.infer<typeof MessageSchema>;
