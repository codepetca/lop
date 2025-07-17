import { describe, it, expect } from 'vitest';
import {
	CharacterStateSchema,
	StoryChoiceSchema,
	StorySceneSchema,
	StoryTemplateSchema,
	GameSessionSchema,
	GameMetadataSchema,
	VoteResultSchema
} from '../../shared/schemas/game';
import { StoryGenre, StoryDifficulty } from '../../shared/schemas/story';
import {
	createTestCharacterState,
	createTestStoryChoice,
	createTestStoryScene,
	createTestStoryTemplate,
	createTestGameSession,
	createTestGameMetadata,
	createTestVoteResult
} from '../utils/fixtures';

describe('Game Schema Validation', () => {
	describe('CharacterStateSchema', () => {
		it('should validate valid character state', () => {
			const validCharacter = createTestCharacterState();
			const result = CharacterStateSchema.safeParse(validCharacter);
			expect(result.success).toBe(true);
		});

		it('should reject character without name', () => {
			const invalidCharacter = createTestCharacterState({ name: '' });
			const result = CharacterStateSchema.safeParse(invalidCharacter);
			expect(result.success).toBe(false);
		});

		it('should allow character with empty inventory', () => {
			const validCharacter = createTestCharacterState({ inventory: [] });
			const result = CharacterStateSchema.safeParse(validCharacter);
			expect(result.success).toBe(true);
		});

		it('should allow character with custom stats', () => {
			const validCharacter = createTestCharacterState({
				stats: { health: 150, magic: 50, strength: 25 }
			});
			const result = CharacterStateSchema.safeParse(validCharacter);
			expect(result.success).toBe(true);
		});

		it('should set default values for optional fields', () => {
			const minimalCharacter = {
				id: 'player-1',
				name: 'Alice',
				currentScene: 'start-scene'
			};
			const result = CharacterStateSchema.safeParse(minimalCharacter);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.stats).toEqual({});
				expect(result.data.inventory).toEqual([]);
				expect(result.data.choices).toEqual([]);
			}
		});
	});

	describe('StoryChoiceSchema', () => {
		it('should validate valid story choice', () => {
			const validChoice = createTestStoryChoice();
			const result = StoryChoiceSchema.safeParse(validChoice);
			expect(result.success).toBe(true);
		});

		it('should reject choice with empty text', () => {
			const invalidChoice = createTestStoryChoice({ text: '' });
			const result = StoryChoiceSchema.safeParse(invalidChoice);
			expect(result.success).toBe(false);
		});

		it('should allow choice with null nextScene (ending)', () => {
			const validChoice = createTestStoryChoice({ nextScene: null });
			const result = StoryChoiceSchema.safeParse(validChoice);
			expect(result.success).toBe(true);
		});

		it('should allow choice with stat effects', () => {
			const validChoice = createTestStoryChoice({
				effects: { health: -10, coins: 5 },
				requirements: { coins: 10 }
			});
			const result = StoryChoiceSchema.safeParse(validChoice);
			expect(result.success).toBe(true);
		});

		it('should allow choice with item management', () => {
			const validChoice = createTestStoryChoice({
				addItems: ['sword', 'potion'],
				removeItems: ['torch']
			});
			const result = StoryChoiceSchema.safeParse(validChoice);
			expect(result.success).toBe(true);
		});

		it('should set default values for optional fields', () => {
			const minimalChoice = {
				id: 'choice-1',
				text: 'Go forward',
				nextScene: 'next-scene'
			};
			const result = StoryChoiceSchema.safeParse(minimalChoice);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.requirements).toEqual({});
				expect(result.data.effects).toEqual({});
				expect(result.data.addItems).toEqual([]);
				expect(result.data.removeItems).toEqual([]);
			}
		});
	});

	describe('StorySceneSchema', () => {
		it('should validate valid story scene', () => {
			const validScene = createTestStoryScene();
			const result = StorySceneSchema.safeParse(validScene);
			expect(result.success).toBe(true);
		});

		it('should reject scene without choices', () => {
			const invalidScene = createTestStoryScene({ choices: [] });
			const result = StorySceneSchema.safeParse(invalidScene);
			expect(result.success).toBe(false);
		});

		it('should reject scene with empty title', () => {
			const invalidScene = createTestStoryScene({ title: '' });
			const result = StorySceneSchema.safeParse(invalidScene);
			expect(result.success).toBe(false);
		});

		it('should reject scene with empty description', () => {
			const invalidScene = createTestStoryScene({ description: '' });
			const result = StorySceneSchema.safeParse(invalidScene);
			expect(result.success).toBe(false);
		});

		it('should allow ending scene', () => {
			const validScene = createTestStoryScene({ isEnding: true });
			const result = StorySceneSchema.safeParse(validScene);
			expect(result.success).toBe(true);
		});

		it('should allow scene with requirements', () => {
			const validScene = createTestStoryScene({
				requirements: { health: 50, coins: 10 }
			});
			const result = StorySceneSchema.safeParse(validScene);
			expect(result.success).toBe(true);
		});
	});

	describe('StoryTemplateSchema', () => {
		it('should validate valid story template', () => {
			const validTemplate = createTestStoryTemplate();
			const result = StoryTemplateSchema.safeParse(validTemplate);
			expect(result.success).toBe(true);
		});

		it('should reject template with empty title', () => {
			const invalidTemplate = createTestStoryTemplate({ title: '' });
			const result = StoryTemplateSchema.safeParse(invalidTemplate);
			expect(result.success).toBe(false);
		});

		it('should reject template with empty description', () => {
			const invalidTemplate = createTestStoryTemplate({ description: '' });
			const result = StoryTemplateSchema.safeParse(invalidTemplate);
			expect(result.success).toBe(false);
		});

		it('should reject template with no scenes', () => {
			const invalidTemplate = createTestStoryTemplate({ scenes: [] });
			const result = StoryTemplateSchema.safeParse(invalidTemplate);
			expect(result.success).toBe(false);
		});

		it('should reject template with invalid difficulty', () => {
			const invalidTemplate = createTestStoryTemplate({ difficulty: 'extreme' as any });
			const result = StoryTemplateSchema.safeParse(invalidTemplate);
			expect(result.success).toBe(false);
		});

		it('should reject template with zero estimated time', () => {
			const invalidTemplate = createTestStoryTemplate({ estimatedTime: 0 });
			const result = StoryTemplateSchema.safeParse(invalidTemplate);
			expect(result.success).toBe(false);
		});

		it('should validate all difficulty levels', () => {
			const difficulties = ['easy', 'medium', 'hard'] as const;
			difficulties.forEach((difficulty) => {
				const validTemplate = createTestStoryTemplate({ difficulty });
				const result = StoryTemplateSchema.safeParse(validTemplate);
				expect(result.success).toBe(true);
			});
		});

		it('should set default values for optional fields', () => {
			const minimalTemplate = {
				id: 'test-story',
				title: 'Test Story',
				description: 'A test story',
				genre: 'fantasy',
				difficulty: 'easy',
				estimatedTime: 30,
				startingScene: 'start',
				scenes: [createTestStoryScene()]
			};
			const result = StoryTemplateSchema.safeParse(minimalTemplate);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.initialStats).toEqual({});
				expect(result.data.initialInventory).toEqual([]);
			}
		});
	});

	describe('GameSessionSchema', () => {
		it('should validate valid game session', () => {
			const validSession = createTestGameSession();
			const result = GameSessionSchema.safeParse(validSession);
			expect(result.success).toBe(true);
		});

		it('should reject session with empty title', () => {
			const invalidSession = createTestGameSession({ title: '' });
			const result = GameSessionSchema.safeParse(invalidSession);
			expect(result.success).toBe(false);
		});

		it('should reject session with zero max players', () => {
			const invalidSession = createTestGameSession({ maxPlayers: 0 });
			const result = GameSessionSchema.safeParse(invalidSession);
			expect(result.success).toBe(false);
		});

		it('should reject session with too many max players', () => {
			const invalidSession = createTestGameSession({ maxPlayers: 100 });
			const result = GameSessionSchema.safeParse(invalidSession);
			expect(result.success).toBe(false);
		});

		it('should validate session with voting timeout limits', () => {
			const validSession = createTestGameSession({
				settings: { votingTimeLimit: 10, allowSpectators: true, showVoteCount: true }
			});
			const result = GameSessionSchema.safeParse(validSession);
			expect(result.success).toBe(true);

			const invalidSession = createTestGameSession({
				settings: { votingTimeLimit: 5, allowSpectators: true, showVoteCount: true }
			});
			const result2 = GameSessionSchema.safeParse(invalidSession);
			expect(result2.success).toBe(false);
		});

		it('should set default values for optional fields', () => {
			const minimalSession = {
				id: 'game-123',
				storyId: 'story-123',
				title: 'Test Game',
				createdAt: new Date().toISOString(),
				currentScene: 'start',
				votingEndsAt: null
			};
			const result = GameSessionSchema.safeParse(minimalSession);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isActive).toBe(true);
				expect(result.data.isCompleted).toBe(false);
				expect(result.data.players).toEqual([]);
				expect(result.data.votingOptions).toEqual([]);
				expect(result.data.votes).toEqual({});
				expect(result.data.maxPlayers).toBe(20);
				expect(result.data.requiresVoting).toBe(true);
				expect(result.data.settings.votingTimeLimit).toBe(60);
			}
		});
	});

	describe('GameMetadataSchema', () => {
		it('should validate valid game metadata', () => {
			const validMetadata = createTestGameMetadata();
			const result = GameMetadataSchema.safeParse(validMetadata);
			expect(result.success).toBe(true);
		});

		it('should reject metadata with negative player count', () => {
			const invalidMetadata = createTestGameMetadata({ playerCount: -1 });
			const result = GameMetadataSchema.safeParse(invalidMetadata);
			expect(result.success).toBe(false);
		});

		it('should reject metadata with zero max players', () => {
			const invalidMetadata = createTestGameMetadata({ maxPlayers: 0 });
			const result = GameMetadataSchema.safeParse(invalidMetadata);
			expect(result.success).toBe(false);
		});

		it('should validate all difficulty levels', () => {
			const difficulties = ['easy', 'medium', 'hard'] as const;
			difficulties.forEach((difficulty) => {
				const validMetadata = createTestGameMetadata({ difficulty });
				const result = GameMetadataSchema.safeParse(validMetadata);
				expect(result.success).toBe(true);
			});
		});
	});

	describe('VoteResultSchema', () => {
		it('should validate valid vote result', () => {
			const validResult = createTestVoteResult();
			const result = VoteResultSchema.safeParse(validResult);
			expect(result.success).toBe(true);
		});

		it('should allow vote result with null next scene', () => {
			const validResult = createTestVoteResult({ nextScene: null });
			const result = VoteResultSchema.safeParse(validResult);
			expect(result.success).toBe(true);
		});

		it('should require winning choice', () => {
			const invalidResult = { ...createTestVoteResult() };
			delete (invalidResult as any).winningChoice;
			const result = VoteResultSchema.safeParse(invalidResult);
			expect(result.success).toBe(false);
		});

		it('should require total votes', () => {
			const invalidResult = { ...createTestVoteResult() };
			delete (invalidResult as any).totalVotes;
			const result = VoteResultSchema.safeParse(invalidResult);
			expect(result.success).toBe(false);
		});

		it('should allow empty choice votes', () => {
			const validResult = createTestVoteResult({ choiceVotes: {} });
			const result = VoteResultSchema.safeParse(validResult);
			expect(result.success).toBe(true);
		});
	});
});
