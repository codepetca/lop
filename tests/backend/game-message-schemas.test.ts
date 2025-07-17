import { describe, it, expect } from 'vitest';
import {
	MessageSchema,
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
} from '../../shared/schemas/message';
import {
	createGameChoiceMessage,
	createGameUpdateMessage,
	createPlayerJoinMessage,
	createVotingStartedMessage,
	createGameCompletedMessage,
	createTestGameSession,
	createTestGameMetadata,
	createTestCharacterState,
	createTestVoteResult
} from '../utils/fixtures';

describe('Game Message Schema Validation', () => {
	describe('GameChoiceMessageSchema', () => {
		it('should validate valid game choice message', () => {
			const validMessage = createGameChoiceMessage();
			const result = GameChoiceMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject choice message without choiceId', () => {
			const invalidMessage = { type: 'game-choice', playerId: 'player-1' };
			const result = GameChoiceMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow choice message without playerId', () => {
			const validMessage = createGameChoiceMessage({ playerId: undefined });
			const result = GameChoiceMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject choice message with wrong type', () => {
			const invalidMessage = { type: 'invalid', choiceId: 'choice-1' };
			const result = GameChoiceMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('GameUpdateMessageSchema', () => {
		it('should validate valid game update message', () => {
			const validMessage = createGameUpdateMessage();
			const result = GameUpdateMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject update message without game data', () => {
			const invalidMessage = { type: 'game-update' };
			const result = GameUpdateMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject update message with invalid game data', () => {
			const invalidMessage = {
				type: 'game-update',
				game: { id: 'test' } // missing required fields
			};
			const result = GameUpdateMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('GameListRequestMessageSchema', () => {
		it('should validate valid game list request', () => {
			const validMessage = { type: 'game-list-request' };
			const result = GameListRequestMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should allow game list request with extra properties', () => {
			const validMessage = { type: 'game-list-request', extra: 'property' };
			const result = GameListRequestMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('GameListMessageSchema', () => {
		it('should validate valid game list message', () => {
			const validMessage = {
				type: 'game-list',
				games: [createTestGameMetadata()]
			};
			const result = GameListMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should validate empty game list', () => {
			const validMessage = { type: 'game-list', games: [] };
			const result = GameListMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject game list with invalid game data', () => {
			const invalidMessage = {
				type: 'game-list',
				games: [{ id: 'game1' }] // missing required fields
			};
			const result = GameListMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('PlayerJoinMessageSchema', () => {
		it('should validate valid player join message', () => {
			const validMessage = createPlayerJoinMessage();
			const result = PlayerJoinMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject join message without player name', () => {
			const invalidMessage = { type: 'player-join', playerId: 'player-1' };
			const result = PlayerJoinMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject join message with empty player name', () => {
			const invalidMessage = createPlayerJoinMessage({ playerName: '' });
			const result = PlayerJoinMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow join message without playerId', () => {
			const validMessage = createPlayerJoinMessage({ playerId: undefined });
			const result = PlayerJoinMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('PlayerJoinedMessageSchema', () => {
		it('should validate valid player joined message', () => {
			const validMessage = {
				type: 'player-joined',
				player: createTestCharacterState()
			};
			const result = PlayerJoinedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject joined message without player data', () => {
			const invalidMessage = { type: 'player-joined' };
			const result = PlayerJoinedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject joined message with invalid player data', () => {
			const invalidMessage = {
				type: 'player-joined',
				player: { id: 'player-1' } // missing required fields
			};
			const result = PlayerJoinedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('PlayerLeftMessageSchema', () => {
		it('should validate valid player left message', () => {
			const validMessage = { type: 'player-left', playerId: 'player-1' };
			const result = PlayerLeftMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject left message without playerId', () => {
			const invalidMessage = { type: 'player-left' };
			const result = PlayerLeftMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('VotingStartedMessageSchema', () => {
		it('should validate valid voting started message', () => {
			const validMessage = createVotingStartedMessage();
			const result = VotingStartedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject voting started message without choices', () => {
			const invalidMessage = {
				type: 'voting-started',
				timeLimit: 60,
				endsAt: new Date().toISOString()
			};
			const result = VotingStartedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject voting started message without timeLimit', () => {
			const invalidMessage = createVotingStartedMessage({ timeLimit: undefined });
			const result = VotingStartedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject voting started message without endsAt', () => {
			const invalidMessage = createVotingStartedMessage({ endsAt: undefined });
			const result = VotingStartedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow empty choices array', () => {
			const validMessage = createVotingStartedMessage({ choices: [] });
			const result = VotingStartedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('VotingEndedMessageSchema', () => {
		it('should validate valid voting ended message', () => {
			const validMessage = {
				type: 'voting-ended',
				result: createTestVoteResult()
			};
			const result = VotingEndedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject voting ended message without result', () => {
			const invalidMessage = { type: 'voting-ended' };
			const result = VotingEndedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject voting ended message with invalid result', () => {
			const invalidMessage = {
				type: 'voting-ended',
				result: { totalVotes: 5 } // missing required fields
			};
			const result = VotingEndedMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('SceneTransitionMessageSchema', () => {
		it('should validate valid scene transition message', () => {
			const validMessage = {
				type: 'scene-transition',
				currentScene: 'forest-scene',
				title: 'The Dark Forest',
				description: 'You enter a mysterious dark forest...'
			};
			const result = SceneTransitionMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject transition message without currentScene', () => {
			const invalidMessage = {
				type: 'scene-transition',
				title: 'Test Scene',
				description: 'Test description'
			};
			const result = SceneTransitionMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject transition message without title', () => {
			const invalidMessage = {
				type: 'scene-transition',
				currentScene: 'test-scene',
				description: 'Test description'
			};
			const result = SceneTransitionMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject transition message without description', () => {
			const invalidMessage = {
				type: 'scene-transition',
				currentScene: 'test-scene',
				title: 'Test Scene'
			};
			const result = SceneTransitionMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow ending scene transition', () => {
			const validMessage = {
				type: 'scene-transition',
				currentScene: 'ending-scene',
				title: 'The End',
				description: 'Your adventure concludes...',
				isEnding: true
			};
			const result = SceneTransitionMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should set default isEnding to false', () => {
			const validMessage = {
				type: 'scene-transition',
				currentScene: 'test-scene',
				title: 'Test Scene',
				description: 'Test description'
			};
			const result = SceneTransitionMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isEnding).toBe(false);
			}
		});
	});

	describe('GameCompletedMessageSchema', () => {
		it('should validate valid game completed message', () => {
			const validMessage = createGameCompletedMessage();
			const result = GameCompletedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should allow game completed message with empty final stats', () => {
			const validMessage = createGameCompletedMessage({ finalStats: {} });
			const result = GameCompletedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should set default finalStats to empty object', () => {
			const validMessage = { type: 'game-completed' };
			const result = GameCompletedMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.finalStats).toEqual({});
			}
		});
	});

	describe('GameErrorMessageSchema', () => {
		it('should validate valid game error message', () => {
			const validMessage = {
				type: 'game-error',
				error: 'invalid_choice',
				message: 'The selected choice is not valid'
			};
			const result = GameErrorMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject error message without error', () => {
			const invalidMessage = {
				type: 'game-error',
				message: 'Something went wrong'
			};
			const result = GameErrorMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow error message without message', () => {
			const validMessage = {
				type: 'game-error',
				error: 'invalid_choice'
			};
			const result = GameErrorMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('MessageSchema (Updated Discriminated Union)', () => {
		it('should validate all game message types', () => {
			const gameMessages = [
				createGameChoiceMessage(),
				createGameUpdateMessage(),
				{ type: 'game-list-request' },
				{ type: 'game-list', games: [] },
				createPlayerJoinMessage(),
				{ type: 'player-joined', player: createTestCharacterState() },
				{ type: 'player-left', playerId: 'player-1' },
				createVotingStartedMessage(),
				{ type: 'voting-ended', result: createTestVoteResult() },
				{
					type: 'scene-transition',
					currentScene: 'test-scene',
					title: 'Test Scene',
					description: 'Test description'
				},
				createGameCompletedMessage(),
				{ type: 'game-error', error: 'test_error' }
			];

			gameMessages.forEach((message, index) => {
				const result = MessageSchema.safeParse(message);
				expect(result.success).toBe(true);
			});
		});

		it('should still validate legacy poll messages', () => {
			const legacyMessages = [
				{ type: 'vote', option: 'Red' },
				{ type: 'poll-update', poll: { id: 'test', title: 'Test', options: ['A', 'B'], votes: { A: 0, B: 0 } } },
				{ type: 'room-list-request' },
				{ type: 'room-list', rooms: [] }
			];

			legacyMessages.forEach((message) => {
				const result = MessageSchema.safeParse(message);
				expect(result.success).toBe(true);
			});
		});

		it('should reject unknown message types', () => {
			const invalidMessages = [
				{ type: 'unknown-type', data: 'test' },
				{ type: 'invalid-game-message', gameId: 'test' },
				{ notAValidMessage: true }
			];

			invalidMessages.forEach((message) => {
				const result = MessageSchema.safeParse(message);
				expect(result.success).toBe(false);
			});
		});
	});
});