import { z } from 'zod';
import { GamePlayerSchema, BasePlayerSchema } from './player';

/**
 * Game Schema System
 *
 * Defines schemas for story-based multiplayer games with voting mechanics.
 * Players progress through scenes by making collective choices.
 */

// Story choice schema - individual choice option
export const StoryChoiceSchema = z.object({
	id: z.string(),
	text: z.string().min(1),
	nextScene: z.string().nullable(), // null for story end
	requirements: z.record(z.string(), z.number()).default({}), // stat requirements
	effects: z.record(z.string(), z.number()).default({}), // stat changes
	addItems: z.array(z.string()).default([]), // items to add
	removeItems: z.array(z.string()).default([]) // items to remove
});

// Story scene schema - individual scene/page
export const StorySceneSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	description: z.string().min(1),
	choices: z.array(StoryChoiceSchema).min(1),
	isEnding: z.boolean().default(false),
	requirements: z.record(z.string(), z.number()).default({}) // requirements to access scene
});

// Story template schema - complete story definition
export const StoryTemplateSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	description: z.string().min(1),
	genre: z.string(),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	estimatedTime: z.number().min(1), // minutes
	startingScene: z.string(),
	scenes: z.array(StorySceneSchema).min(1),
	initialStats: z.record(z.string(), z.number()).default({}),
	initialInventory: z.array(z.string()).default([])
});

// Game session schema - active game state
export const GameSessionSchema = z.object({
	id: z.string(),
	storyId: z.string(),
	title: z.string().min(1),
	createdAt: z.string(),
	currentScene: z.string(),
	isActive: z.boolean().default(true),
	isCompleted: z.boolean().default(false),
	creator: BasePlayerSchema, // Add creator information
	players: z.array(GamePlayerSchema).default([]),
	votingOptions: z.array(StoryChoiceSchema).default([]), // current choices being voted on
	votes: z.record(z.string(), z.number()).default({}), // choiceId -> vote count
	votingEndsAt: z.string().nullable(), // ISO timestamp
	maxPlayers: z.number().min(1).max(50).default(20),
	requiresVoting: z.boolean().default(true), // false for single-player
	settings: z
		.object({
			votingTimeLimit: z.number().min(10).max(300).default(60), // seconds
			allowSpectators: z.boolean().default(true),
			showVoteCount: z.boolean().default(true)
		})
		.default({
			votingTimeLimit: 60,
			allowSpectators: true,
			showVoteCount: true
		})
});

// Game metadata for lobby listing
export const GameMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	storyTitle: z.string(),
	genre: z.string(),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	createdAt: z.string(),
	currentScene: z.string(),
	isActive: z.boolean(),
	isCompleted: z.boolean(),
	playerCount: z.number().min(0),
	maxPlayers: z.number().min(1),
	estimatedTime: z.number(), // minutes
	requiresVoting: z.boolean(),
	creator: BasePlayerSchema // Add creator information
});

// Vote result schema - outcome of a voting round
export const VoteResultSchema = z.object({
	winningChoice: StoryChoiceSchema,
	totalVotes: z.number(),
	choiceVotes: z.record(z.string(), z.number()),
	nextScene: z.string().nullable()
});

// Export TypeScript types inferred from schemas
export type GameSession = z.infer<typeof GameSessionSchema>;
export type GameMetadata = z.infer<typeof GameMetadataSchema>;
export type StoryChoice = z.infer<typeof StoryChoiceSchema>;
export type StoryScene = z.infer<typeof StorySceneSchema>;
export type StoryTemplate = z.infer<typeof StoryTemplateSchema>;
export type VoteResult = z.infer<typeof VoteResultSchema>;

// Re-export player types for convenience
export type { GamePlayer, CharacterState } from './player';
