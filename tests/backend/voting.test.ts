import { describe, it, expect, vi } from 'vitest';
import { handleVote } from '../../party/handlers';
import { createTestPoll, createVoteMessage } from '../utils/fixtures';
import { createMockRoom } from '../utils/mocks';

describe('Voting Logic', () => {
	describe('handleVote', () => {
		it('should increment vote count for valid option', async () => {
			const room = createMockRoom();
			const poll = createTestPoll();
			const voteMessage = createVoteMessage({ option: 'Red' });

			const result = await handleVote(room, poll, voteMessage);

			expect(result).toBeTruthy();
			expect(result?.votes.Red).toBe(1);
			expect(result?.votes.Blue).toBe(0);
			expect(room.storage.put).toHaveBeenCalledWith('poll', result);
			expect(room.broadcast).toHaveBeenCalledWith(
				JSON.stringify({
					type: 'poll-update',
					poll: result
				})
			);
		});

		it('should handle multiple votes for same option', async () => {
			const room = createMockRoom();
			const poll = createTestPoll({
				votes: { Red: ['player1', 'player2'], Blue: ['player3'], Green: [], Yellow: [] }
			});
			const voteMessage = createVoteMessage({ option: 'Red' });

			const result = await handleVote(room, poll, voteMessage);

			expect(result?.votes.Red).toBe(3);
			expect(result?.votes.Blue).toBe(1);
		});

		it('should handle votes for different options', async () => {
			const room = createMockRoom();
			const poll = createTestPoll();

			// Vote for Red
			const redVote = createVoteMessage({ option: 'Red' });
			const result1 = await handleVote(room, poll, redVote);

			// Vote for Blue
			const blueVote = createVoteMessage({ option: 'Blue' });
			const result2 = await handleVote(room, result1!, blueVote);

			expect(result2?.votes.Red).toBe(1);
			expect(result2?.votes.Blue).toBe(1);
			expect(result2?.votes.Green).toBe(0);
			expect(result2?.votes.Yellow).toBe(0);
		});

		it('should reject vote for invalid option', async () => {
			const room = createMockRoom();
			const poll = createTestPoll();
			const invalidVote = createVoteMessage({ option: 'Purple' });

			const result = await handleVote(room, poll, invalidVote);

			expect(result).toBeNull();
			expect(room.storage.put).not.toHaveBeenCalled();
			expect(room.broadcast).not.toHaveBeenCalled();
		});

		it('should reject vote for empty option', async () => {
			const room = createMockRoom();
			const poll = createTestPoll();
			const invalidVote = createVoteMessage({ option: '' });

			const result = await handleVote(room, poll, invalidVote);

			expect(result).toBeNull();
			expect(room.storage.put).not.toHaveBeenCalled();
			expect(room.broadcast).not.toHaveBeenCalled();
		});

		it('should handle vote when option has no existing votes', async () => {
			const room = createMockRoom();
			const poll = createTestPoll({
				votes: { Red: [], Blue: [], Green: [], Yellow: [] }
			});
			const voteMessage = createVoteMessage({ option: 'Green' });

			const result = await handleVote(room, poll, voteMessage);

			expect(result?.votes.Green).toBe(1);
			expect(result?.votes.Red).toBe(0);
		});

		it('should preserve other vote counts when voting', async () => {
			const room = createMockRoom();
			const poll = createTestPoll({
				votes: {
					Red: ['p1', 'p2', 'p3', 'p4', 'p5'],
					Blue: ['p6', 'p7', 'p8'],
					Green: ['p9'],
					Yellow: ['p10', 'p11']
				}
			});
			const voteMessage = createVoteMessage({ option: 'Blue' });

			const result = await handleVote(room, poll, voteMessage);

			expect(result?.votes.Red).toBe(5);
			expect(result?.votes.Blue).toBe(4);
			expect(result?.votes.Green).toBe(1);
			expect(result?.votes.Yellow).toBe(2);
		});

		it('should log warning for invalid vote option', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const room = createMockRoom();
			const poll = createTestPoll();
			const invalidVote = createVoteMessage({ option: 'InvalidOption' });

			await handleVote(room, poll, invalidVote);

			expect(consoleSpy).toHaveBeenCalledWith('Invalid vote option: InvalidOption');
			consoleSpy.mockRestore();
		});
	});
});
