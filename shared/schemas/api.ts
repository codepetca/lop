import { z } from 'zod';
import { PollSchema } from './poll';
import { GameSessionSchema, GameMetadataSchema } from './game';
import { StoryFilterSchema } from './story';
import { BasePlayerSchema } from './player';

// Create poll request schema
export const CreatePollRequestSchema = z.object({
	title: z.string().optional(),
	options: z.array(z.string()).min(2).optional()
});

// Create poll response schema
export const CreatePollResponseSchema = z.object({
	success: z.boolean(),
	poll: PollSchema.optional(),
	error: z.string().optional()
});

// Get poll response schema
export const GetPollResponseSchema = z.object({
	poll: PollSchema.nullable()
});

// Room registration request schema
export const RegisterRoomRequestSchema = z.object({
	id: z.string(),
	title: z.string()
});

// Room registration response schema
export const RegisterRoomResponseSchema = z.object({
	success: z.boolean(),
	error: z.string().optional()
});

// Generic API error response schema
export const ApiErrorResponseSchema = z.object({
	error: z.string(),
	message: z.string().optional()
});

// Game-specific API schemas
export const CreateGameRequestSchema = z.object({
	title: z.string().optional(), // custom title, falls back to story title
	storyId: z.string(), // which story template to use
	maxPlayers: z.number().min(1).max(50).default(6),
	requiresVoting: z.boolean().default(true),
	creator: BasePlayerSchema, // creator player information
	settings: z
		.object({
			votingTimeLimit: z.number().min(10).max(300).default(60),
			allowSpectators: z.boolean().default(true),
			showVoteCount: z.boolean().default(true)
		})
		.optional()
});

export const CreateGameResponseSchema = z.object({
	success: z.boolean(),
	game: GameSessionSchema.optional(),
	error: z.string().optional()
});

export const GetGameResponseSchema = z.object({
	game: GameSessionSchema.nullable()
});

export const GetGameListRequestSchema = z.object({
	filter: StoryFilterSchema.optional(),
	includeCompleted: z.boolean().default(false),
	includeInactive: z.boolean().default(false)
});

export const GetGameListResponseSchema = z.object({
	games: z.array(GameMetadataSchema),
	total: z.number().min(0)
});

export const GetStoriesResponseSchema = z.object({
	stories: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			description: z.string(),
			genre: z.string(),
			difficulty: z.enum(['easy', 'medium', 'hard']),
			estimatedTime: z.number()
		})
	)
});

export const JoinGameRequestSchema = z.object({
	playerName: z.string().min(1),
	playerId: z.string().optional()
});

export const JoinGameResponseSchema = z.object({
	success: z.boolean(),
	playerId: z.string().optional(),
	error: z.string().optional()
});

export const RegisterGameRequestSchema = z.object({
	id: z.string(),
	title: z.string(),
	storyTitle: z.string(),
	genre: z.string(),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	creator: BasePlayerSchema
});

export const RegisterGameResponseSchema = z.object({
	success: z.boolean(),
	error: z.string().optional()
});

// Export TypeScript types inferred from schemas
export type CreatePollRequest = z.infer<typeof CreatePollRequestSchema>;
export type CreatePollResponse = z.infer<typeof CreatePollResponseSchema>;
export type GetPollResponse = z.infer<typeof GetPollResponseSchema>;
export type RegisterRoomRequest = z.infer<typeof RegisterRoomRequestSchema>;
export type RegisterRoomResponse = z.infer<typeof RegisterRoomResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// Game API types
export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>;
export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>;
export type GetGameResponse = z.infer<typeof GetGameResponseSchema>;
export type GetGameListRequest = z.infer<typeof GetGameListRequestSchema>;
export type GetGameListResponse = z.infer<typeof GetGameListResponseSchema>;
export type GetStoriesResponse = z.infer<typeof GetStoriesResponseSchema>;
export type JoinGameRequest = z.infer<typeof JoinGameRequestSchema>;
export type JoinGameResponse = z.infer<typeof JoinGameResponseSchema>;
export type RegisterGameRequest = z.infer<typeof RegisterGameRequestSchema>;
export type RegisterGameResponse = z.infer<typeof RegisterGameResponseSchema>;
