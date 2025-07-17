import { z } from 'zod';
import { StoryTemplateSchema } from './game';

// Story categories and themes
export const StoryGenre = z.enum([
	'fantasy',
	'sci-fi',
	'horror',
	'mystery',
	'adventure',
	'comedy',
	'romance',
	'thriller',
	'western',
	'post-apocalyptic'
]);

// Story difficulty levels with descriptions
export const StoryDifficulty = z.enum(['easy', 'medium', 'hard']);

// Story template collection schema
export const StoryCollectionSchema = z.object({
	categories: z.array(StoryGenre),
	difficulties: z.array(StoryDifficulty),
	templates: z.array(StoryTemplateSchema)
});

// Story search/filter schema
export const StoryFilterSchema = z.object({
	genre: StoryGenre.optional(),
	difficulty: StoryDifficulty.optional(),
	maxTime: z.number().min(1).optional(), // max estimated time in minutes
	minPlayers: z.number().min(1).optional(),
	maxPlayers: z.number().min(1).optional()
});

// Story statistics schema
export const StoryStatsSchema = z.object({
	storyId: z.string(),
	timesPlayed: z.number().default(0),
	averageRating: z.number().min(1).max(5).default(3),
	averagePlayTime: z.number().min(1).default(30), // minutes
	completionRate: z.number().min(0).max(100).default(0), // percentage
	popularChoices: z.record(z.string(), z.string()).default({}) // sceneId -> most popular choiceId
});

// Export TypeScript types inferred from schemas
export type StoryGenreType = z.infer<typeof StoryGenre>;
export type StoryDifficultyType = z.infer<typeof StoryDifficulty>;
export type StoryCollection = z.infer<typeof StoryCollectionSchema>;
export type StoryFilter = z.infer<typeof StoryFilterSchema>;
export type StoryStats = z.infer<typeof StoryStatsSchema>;
