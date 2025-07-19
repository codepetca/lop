import { describe, it, expect } from 'vitest';
import {
	StoryGenre,
	StoryDifficulty,
	StoryCollectionSchema,
	StoryFilterSchema,
	StoryStatsSchema
} from '$shared/schemas/story';
import { createTestStoryTemplate, testStories } from '../utils/fixtures';

describe('Story Schema Validation', () => {
	describe('StoryGenre', () => {
		it('should validate all story genres', () => {
			const validGenres = [
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
			];

			validGenres.forEach((genre) => {
				const result = StoryGenre.safeParse(genre);
				expect(result.success).toBe(true);
			});
		});

		it('should reject invalid genre', () => {
			const invalidGenres = ['invalid', 'unknown', 'drama'];
			invalidGenres.forEach((genre) => {
				const result = StoryGenre.safeParse(genre);
				expect(result.success).toBe(false);
			});
		});
	});

	describe('StoryDifficulty', () => {
		it('should validate all story difficulties', () => {
			const validDifficulties = ['easy', 'medium', 'hard'];
			validDifficulties.forEach((difficulty) => {
				const result = StoryDifficulty.safeParse(difficulty);
				expect(result.success).toBe(true);
			});
		});

		it('should reject invalid difficulty', () => {
			const invalidDifficulties = ['beginner', 'expert', 'extreme'];
			invalidDifficulties.forEach((difficulty) => {
				const result = StoryDifficulty.safeParse(difficulty);
				expect(result.success).toBe(false);
			});
		});
	});

	describe('StoryCollectionSchema', () => {
		it('should validate valid story collection', () => {
			const validCollection = {
				categories: ['fantasy', 'sci-fi', 'horror'],
				difficulties: ['easy', 'medium', 'hard'],
				templates: testStories
			};
			const result = StoryCollectionSchema.safeParse(validCollection);
			expect(result.success).toBe(true);
		});

		it('should allow empty categories', () => {
			const validCollection = {
				categories: [],
				difficulties: ['easy'],
				templates: [createTestStoryTemplate()]
			};
			const result = StoryCollectionSchema.safeParse(validCollection);
			expect(result.success).toBe(true);
		});

		it('should allow empty templates', () => {
			const validCollection = {
				categories: ['fantasy'],
				difficulties: ['easy'],
				templates: []
			};
			const result = StoryCollectionSchema.safeParse(validCollection);
			expect(result.success).toBe(true);
		});

		it('should reject invalid category in collection', () => {
			const invalidCollection = {
				categories: ['fantasy', 'invalid-genre'],
				difficulties: ['easy'],
				templates: []
			};
			const result = StoryCollectionSchema.safeParse(invalidCollection);
			expect(result.success).toBe(false);
		});

		it('should reject invalid difficulty in collection', () => {
			const invalidCollection = {
				categories: ['fantasy'],
				difficulties: ['easy', 'extreme'],
				templates: []
			};
			const result = StoryCollectionSchema.safeParse(invalidCollection);
			expect(result.success).toBe(false);
		});
	});

	describe('StoryFilterSchema', () => {
		it('should validate valid story filter', () => {
			const validFilter = {
				genre: 'fantasy',
				difficulty: 'easy',
				maxTime: 30,
				minPlayers: 1,
				maxPlayers: 10
			};
			const result = StoryFilterSchema.safeParse(validFilter);
			expect(result.success).toBe(true);
		});

		it('should allow empty filter', () => {
			const validFilter = {};
			const result = StoryFilterSchema.safeParse(validFilter);
			expect(result.success).toBe(true);
		});

		it('should allow partial filter', () => {
			const validFilter = {
				genre: 'sci-fi',
				maxTime: 60
			};
			const result = StoryFilterSchema.safeParse(validFilter);
			expect(result.success).toBe(true);
		});

		it('should reject invalid genre in filter', () => {
			const invalidFilter = {
				genre: 'invalid-genre',
				difficulty: 'easy'
			};
			const result = StoryFilterSchema.safeParse(invalidFilter);
			expect(result.success).toBe(false);
		});

		it('should reject invalid difficulty in filter', () => {
			const invalidFilter = {
				genre: 'fantasy',
				difficulty: 'extreme'
			};
			const result = StoryFilterSchema.safeParse(invalidFilter);
			expect(result.success).toBe(false);
		});

		it('should reject zero or negative time limits', () => {
			const invalidFilters = [{ maxTime: 0 }, { maxTime: -10 }];
			invalidFilters.forEach((filter) => {
				const result = StoryFilterSchema.safeParse(filter);
				expect(result.success).toBe(false);
			});
		});

		it('should reject zero or negative player counts', () => {
			const invalidFilters = [
				{ minPlayers: 0 },
				{ minPlayers: -1 },
				{ maxPlayers: 0 },
				{ maxPlayers: -1 }
			];
			invalidFilters.forEach((filter) => {
				const result = StoryFilterSchema.safeParse(filter);
				expect(result.success).toBe(false);
			});
		});
	});

	describe('StoryStatsSchema', () => {
		it('should validate valid story stats', () => {
			const validStats = {
				storyId: 'fantasy-adventure',
				timesPlayed: 25,
				averageRating: 4.2,
				averagePlayTime: 35,
				completionRate: 78.5,
				popularChoices: {
					'scene-1': 'choice-a',
					'scene-2': 'choice-b'
				}
			};
			const result = StoryStatsSchema.safeParse(validStats);
			expect(result.success).toBe(true);
		});

		it('should set default values for optional fields', () => {
			const minimalStats = {
				storyId: 'test-story'
			};
			const result = StoryStatsSchema.safeParse(minimalStats);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.timesPlayed).toBe(0);
				expect(result.data.averageRating).toBe(3);
				expect(result.data.averagePlayTime).toBe(30);
				expect(result.data.completionRate).toBe(0);
				expect(result.data.popularChoices).toEqual({});
			}
		});

		it('should reject stats with invalid rating range', () => {
			const invalidStats = [
				{ storyId: 'test', averageRating: 0 },
				{ storyId: 'test', averageRating: 6 },
				{ storyId: 'test', averageRating: -1 }
			];
			invalidStats.forEach((stats) => {
				const result = StoryStatsSchema.safeParse(stats);
				expect(result.success).toBe(false);
			});
		});

		it('should reject stats with zero or negative play time', () => {
			const invalidStats = [
				{ storyId: 'test', averagePlayTime: 0 },
				{ storyId: 'test', averagePlayTime: -5 }
			];
			invalidStats.forEach((stats) => {
				const result = StoryStatsSchema.safeParse(stats);
				expect(result.success).toBe(false);
			});
		});

		it('should reject stats with invalid completion rate', () => {
			const invalidStats = [
				{ storyId: 'test', completionRate: -1 },
				{ storyId: 'test', completionRate: 101 }
			];
			invalidStats.forEach((stats) => {
				const result = StoryStatsSchema.safeParse(stats);
				expect(result.success).toBe(false);
			});
		});

		it('should allow valid completion rate range', () => {
			const validStats = [
				{ storyId: 'test', completionRate: 0 },
				{ storyId: 'test', completionRate: 50 },
				{ storyId: 'test', completionRate: 100 }
			];
			validStats.forEach((stats) => {
				const result = StoryStatsSchema.safeParse(stats);
				expect(result.success).toBe(true);
			});
		});

		it('should allow empty popular choices', () => {
			const validStats = {
				storyId: 'test-story',
				popularChoices: {}
			};
			const result = StoryStatsSchema.safeParse(validStats);
			expect(result.success).toBe(true);
		});
	});
});
