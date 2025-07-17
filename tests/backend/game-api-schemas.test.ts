import { describe, it, expect } from 'vitest';
import {
	CreateGameRequestSchema,
	CreateGameResponseSchema,
	GetGameResponseSchema,
	GetGameListRequestSchema,
	GetGameListResponseSchema,
	GetStoriesResponseSchema,
	JoinGameRequestSchema,
	JoinGameResponseSchema,
	RegisterGameRequestSchema,
	RegisterGameResponseSchema
} from '../../shared/schemas/api';
import {
	createTestGameSession,
	createTestGameMetadata,
	testStories
} from '../utils/fixtures';

describe('Game API Schema Validation', () => {
	describe('CreateGameRequestSchema', () => {
		it('should validate valid create game request', () => {
			const validRequest = {
				storyId: 'fantasy-adventure',
				title: 'My Adventure Game',
				maxPlayers: 10,
				requiresVoting: true,
				settings: {
					votingTimeLimit: 90,
					allowSpectators: false,
					showVoteCount: true
				}
			};
			const result = CreateGameRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should require storyId', () => {
			const invalidRequest = {
				title: 'My Adventure Game',
				maxPlayers: 10
			};
			const result = CreateGameRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it('should allow minimal request with only storyId', () => {
			const validRequest = {
				storyId: 'fantasy-adventure'
			};
			const result = CreateGameRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should reject request with invalid max players', () => {
			const invalidRequests = [
				{ storyId: 'test', maxPlayers: 0 },
				{ storyId: 'test', maxPlayers: -1 },
				{ storyId: 'test', maxPlayers: 100 }
			];
			invalidRequests.forEach(request => {
				const result = CreateGameRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			});
		});

		it('should reject request with invalid voting time limit', () => {
			const invalidRequests = [
				{ storyId: 'test', settings: { votingTimeLimit: 5 } },
				{ storyId: 'test', settings: { votingTimeLimit: 500 } }
			];
			invalidRequests.forEach(request => {
				const result = CreateGameRequestSchema.safeParse(request);
				expect(result.success).toBe(false);
			});
		});

		it('should set default values for optional fields', () => {
			const minimalRequest = {
				storyId: 'fantasy-adventure'
			};
			const result = CreateGameRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.maxPlayers).toBe(20);
				expect(result.data.requiresVoting).toBe(true);
			}
		});
	});

	describe('CreateGameResponseSchema', () => {
		it('should validate successful create game response', () => {
			const validResponse = {
				success: true,
				game: createTestGameSession()
			};
			const result = CreateGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate error create game response', () => {
			const validResponse = {
				success: false,
				error: 'Story not found'
			};
			const result = CreateGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should require success field', () => {
			const invalidResponse = {
				game: createTestGameSession()
			};
			const result = CreateGameResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should allow response without game or error', () => {
			const validResponse = {
				success: true
			};
			const result = CreateGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});
	});

	describe('GetGameResponseSchema', () => {
		it('should validate response with game data', () => {
			const validResponse = {
				game: createTestGameSession()
			};
			const result = GetGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate response with null game', () => {
			const validResponse = {
				game: null
			};
			const result = GetGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should reject response without game field', () => {
			const invalidResponse = {};
			const result = GetGameResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});
	});

	describe('GetGameListRequestSchema', () => {
		it('should validate request with all filters', () => {
			const validRequest = {
				filter: {
					genre: 'fantasy',
					difficulty: 'easy',
					maxTime: 60
				},
				includeCompleted: true,
				includeInactive: false
			};
			const result = GetGameListRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should validate empty request', () => {
			const validRequest = {};
			const result = GetGameListRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should set default values for optional fields', () => {
			const minimalRequest = {};
			const result = GetGameListRequestSchema.safeParse(minimalRequest);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.includeCompleted).toBe(false);
				expect(result.data.includeInactive).toBe(false);
			}
		});

		it('should reject request with invalid filter', () => {
			const invalidRequest = {
				filter: {
					genre: 'invalid-genre'
				}
			};
			const result = GetGameListRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});
	});

	describe('GetGameListResponseSchema', () => {
		it('should validate response with games', () => {
			const validResponse = {
				games: [createTestGameMetadata()],
				total: 1
			};
			const result = GetGameListResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate response with empty games', () => {
			const validResponse = {
				games: [],
				total: 0
			};
			const result = GetGameListResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should reject response without games field', () => {
			const invalidResponse = {
				total: 0
			};
			const result = GetGameListResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should reject response without total field', () => {
			const invalidResponse = {
				games: []
			};
			const result = GetGameListResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should reject response with negative total', () => {
			const invalidResponse = {
				games: [],
				total: -1
			};
			const result = GetGameListResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});
	});

	describe('GetStoriesResponseSchema', () => {
		it('should validate response with stories', () => {
			const validResponse = {
				stories: [
					{
						id: 'fantasy-adventure',
						title: 'The Enchanted Forest',
						description: 'A magical adventure',
						genre: 'fantasy',
						difficulty: 'easy',
						estimatedTime: 30
					}
				]
			};
			const result = GetStoriesResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate response with empty stories', () => {
			const validResponse = {
				stories: []
			};
			const result = GetStoriesResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should reject response without stories field', () => {
			const invalidResponse = {};
			const result = GetStoriesResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should reject response with invalid story data', () => {
			const invalidResponse = {
				stories: [
					{
						id: 'test-story',
						title: 'Test Story'
						// missing required fields
					}
				]
			};
			const result = GetStoriesResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should reject response with invalid difficulty', () => {
			const invalidResponse = {
				stories: [
					{
						id: 'test-story',
						title: 'Test Story',
						description: 'Test description',
						genre: 'fantasy',
						difficulty: 'extreme',
						estimatedTime: 30
					}
				]
			};
			const result = GetStoriesResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});
	});

	describe('JoinGameRequestSchema', () => {
		it('should validate valid join game request', () => {
			const validRequest = {
				playerName: 'Alice',
				playerId: 'player-123'
			};
			const result = JoinGameRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should require playerName', () => {
			const invalidRequest = {
				playerId: 'player-123'
			};
			const result = JoinGameRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it('should reject request with empty playerName', () => {
			const invalidRequest = {
				playerName: '',
				playerId: 'player-123'
			};
			const result = JoinGameRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});

		it('should allow request without playerId', () => {
			const validRequest = {
				playerName: 'Alice'
			};
			const result = JoinGameRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});
	});

	describe('JoinGameResponseSchema', () => {
		it('should validate successful join response', () => {
			const validResponse = {
				success: true,
				playerId: 'player-123'
			};
			const result = JoinGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate error join response', () => {
			const validResponse = {
				success: false,
				error: 'Game is full'
			};
			const result = JoinGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should require success field', () => {
			const invalidResponse = {
				playerId: 'player-123'
			};
			const result = JoinGameResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should allow response without playerId or error', () => {
			const validResponse = {
				success: true
			};
			const result = JoinGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});
	});

	describe('RegisterGameRequestSchema', () => {
		it('should validate valid register game request', () => {
			const validRequest = {
				id: 'game-123',
				title: 'My Adventure Game',
				storyTitle: 'The Enchanted Forest',
				genre: 'fantasy',
				difficulty: 'easy'
			};
			const result = RegisterGameRequestSchema.safeParse(validRequest);
			expect(result.success).toBe(true);
		});

		it('should require all fields', () => {
			const requiredFields = ['id', 'title', 'storyTitle', 'genre', 'difficulty'];
			requiredFields.forEach(field => {
				const invalidRequest = {
					id: 'game-123',
					title: 'My Adventure Game',
					storyTitle: 'The Enchanted Forest',
					genre: 'fantasy',
					difficulty: 'easy'
				};
				delete (invalidRequest as any)[field];
				const result = RegisterGameRequestSchema.safeParse(invalidRequest);
				expect(result.success).toBe(false);
			});
		});

		it('should reject request with invalid difficulty', () => {
			const invalidRequest = {
				id: 'game-123',
				title: 'My Adventure Game',
				storyTitle: 'The Enchanted Forest',
				genre: 'fantasy',
				difficulty: 'extreme'
			};
			const result = RegisterGameRequestSchema.safeParse(invalidRequest);
			expect(result.success).toBe(false);
		});
	});

	describe('RegisterGameResponseSchema', () => {
		it('should validate successful register response', () => {
			const validResponse = {
				success: true
			};
			const result = RegisterGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should validate error register response', () => {
			const validResponse = {
				success: false,
				error: 'Game already exists'
			};
			const result = RegisterGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});

		it('should require success field', () => {
			const invalidResponse = {
				error: 'Game already exists'
			};
			const result = RegisterGameResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});

		it('should allow response without error', () => {
			const validResponse = {
				success: true
			};
			const result = RegisterGameResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
		});
	});
});