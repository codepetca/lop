import { z } from 'zod';
import { PollSchema } from './poll';
import { PollPlayerSchema, GamePlayerSchema, AvatarConfigSchema } from './player';
import { GameSessionSchema, GameMetadataSchema, StoryChoiceSchema, VoteResultSchema } from './game';

/**
 * WebSocket Message Schema System
 *
 * Defines all WebSocket message types used for real-time communication.
 * Messages are organized by domain: polls, games, and lobby management.
 */

// ===========================================
// POLL MESSAGES
// ===========================================

/** Vote for a poll option (requires player to be joined to poll) */
export const VoteMessageSchema = z.object({
	type: z.literal('vote'),
	option: z.string(),
	playerId: z.string().uuid()
});

/** Request to join a poll (sent by client) */
export const PlayerJoinPollMessageSchema = z.object({
	type: z.literal('player-join-poll'),
	playerName: z.string().min(1).max(50).optional(), // Optional - will generate if not provided
	playerId: z.string().uuid().optional(), // Optional - will generate if not provided
	avatar: AvatarConfigSchema.optional()
});

/** Broadcast when a player joins a poll */
export const PlayerJoinedPollMessageSchema = z.object({
	type: z.literal('player-joined-poll'),
	player: PollPlayerSchema
});

/** Broadcast poll state updates to all connected clients */
export const PollUpdateMessageSchema = z.object({
	type: z.literal('poll-update'),
	poll: PollSchema
});

// ===========================================
// LOBBY MANAGEMENT MESSAGES
// ===========================================

/** Room metadata for lobby listings (legacy poll support) */
export const RoomMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	createdAt: z.string(),
	activeConnections: z.number().default(0),
	totalVotes: z.number().default(0)
});

/** Request list of available rooms/polls */
export const RoomListRequestMessageSchema = z.object({
	type: z.literal('room-list-request')
});

/** Response with list of available rooms/polls */
export const RoomListMessageSchema = z.object({
	type: z.literal('room-list'),
	rooms: z.array(RoomMetadataSchema)
});

// ===========================================
// GAME MESSAGES
// ===========================================

/** Vote for a choice in a story game */
export const GameChoiceMessageSchema = z.object({
	type: z.literal('game-choice'),
	choiceId: z.string(),
	playerId: z.string().uuid().optional() // for player identification
});

/** Broadcast game state updates to all connected clients */
export const GameUpdateMessageSchema = z.object({
	type: z.literal('game-update'),
	game: GameSessionSchema
});

/** Request list of available games */
export const GameListRequestMessageSchema = z.object({
	type: z.literal('game-list-request')
});

/** Response with list of available games */
export const GameListMessageSchema = z.object({
	type: z.literal('game-list'),
	games: z.array(GameMetadataSchema)
});

/** Request to join a game (sent by client) */
export const PlayerJoinMessageSchema = z.object({
	type: z.literal('player-join'),
	playerName: z.string().min(1).max(50),
	playerId: z.string().uuid().optional(),
	avatar: AvatarConfigSchema.optional()
});

/** Broadcast when a player joins a game */
export const PlayerJoinedMessageSchema = z.object({
	type: z.literal('player-joined'),
	player: GamePlayerSchema
});

/** Broadcast when a player leaves a game */
export const PlayerLeftMessageSchema = z.object({
	type: z.literal('player-left'),
	playerId: z.string().uuid()
});

/** Broadcast when voting begins for story choices */
export const VotingStartedMessageSchema = z.object({
	type: z.literal('voting-started'),
	choices: z.array(StoryChoiceSchema),
	timeLimit: z.number(), // seconds
	endsAt: z.string() // ISO timestamp
});

/** Broadcast when voting ends with results */
export const VotingEndedMessageSchema = z.object({
	type: z.literal('voting-ended'),
	result: VoteResultSchema
});

/** Broadcast when transitioning to a new story scene */
export const SceneTransitionMessageSchema = z.object({
	type: z.literal('scene-transition'),
	currentScene: z.string(),
	title: z.string(),
	description: z.string(),
	isEnding: z.boolean().default(false)
});

/** Broadcast when a game is completed */
export const GameCompletedMessageSchema = z.object({
	type: z.literal('game-completed'),
	finalStats: z.record(z.string(), z.number()).default({})
});

/** Broadcast when a game error occurs */
export const GameErrorMessageSchema = z.object({
	type: z.literal('game-error'),
	error: z.string(),
	message: z.string().optional()
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
