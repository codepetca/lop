import { describe, it, expect } from 'vitest';
import {
	MessageSchema,
	VoteMessageSchema,
	PollUpdateMessageSchema,
	RoomListRequestMessageSchema,
	RoomListMessageSchema
} from '../../shared/schemas/message';
import { PollSchema } from '../../shared/schemas/poll';
import { createTestPoll, createVoteMessage, createPollUpdateMessage } from '../utils/fixtures';

describe('Schema Validation', () => {
	describe('VoteMessageSchema', () => {
		it('should validate valid vote message', () => {
			const validMessage = createVoteMessage();
			const result = VoteMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject vote message without option', () => {
			const invalidMessage = { type: 'vote' };
			const result = VoteMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject vote message with wrong type', () => {
			const invalidMessage = { type: 'invalid', option: 'Red' };
			const result = VoteMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should allow vote message with empty option', () => {
			// Empty string is valid according to the schema
			const validMessage = createVoteMessage({ option: '' });
			const result = VoteMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('PollUpdateMessageSchema', () => {
		it('should validate valid poll update message', () => {
			const validMessage = createPollUpdateMessage();
			const result = PollUpdateMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject poll update without poll data', () => {
			const invalidMessage = { type: 'poll-update' };
			const result = PollUpdateMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject poll update with invalid poll data', () => {
			const invalidMessage = {
				type: 'poll-update',
				poll: { id: 'test', title: 'Test' } // missing options and votes
			};
			const result = PollUpdateMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('RoomListRequestMessageSchema', () => {
		it('should validate valid room list request', () => {
			const validMessage = { type: 'room-list-request' };
			const result = RoomListRequestMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should allow room list request with extra properties', () => {
			// Zod object schemas allow extra properties by default
			const validMessage = { type: 'room-list-request', extra: 'property' };
			const result = RoomListRequestMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});
	});

	describe('RoomListMessageSchema', () => {
		it('should validate valid room list message', () => {
			const validMessage = {
				type: 'room-list',
				rooms: [
					{
						id: 'room1',
						title: 'Test Room',
						createdAt: new Date().toISOString(),
						activeConnections: 0,
						totalVotes: 0
					}
				]
			};
			const result = RoomListMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should validate empty room list', () => {
			const validMessage = { type: 'room-list', rooms: [] };
			const result = RoomListMessageSchema.safeParse(validMessage);
			expect(result.success).toBe(true);
		});

		it('should reject room list with invalid room data', () => {
			const invalidMessage = {
				type: 'room-list',
				rooms: [{ id: 'room1' }] // missing required fields
			};
			const result = RoomListMessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});

	describe('PollSchema', () => {
		it('should validate valid poll', () => {
			const validPoll = createTestPoll();
			const result = PollSchema.safeParse(validPoll);
			expect(result.success).toBe(true);
		});

		it('should reject poll with less than 2 options', () => {
			const invalidPoll = createTestPoll({
				options: ['Only One'],
				votes: { 'Only One': [] }
			});
			const result = PollSchema.safeParse(invalidPoll);
			expect(result.success).toBe(false);
		});

		it('should reject poll with empty title', () => {
			const invalidPoll = createTestPoll({ title: '' });
			const result = PollSchema.safeParse(invalidPoll);
			expect(result.success).toBe(false);
		});

		it('should allow poll with extra vote keys', () => {
			// The schema allows extra keys in the votes record
			const validPoll = createTestPoll({
				options: ['Red', 'Blue'],
				votes: { Red: [], Blue: [], Green: [] } // Green not in options but valid in record
			});
			const result = PollSchema.safeParse(validPoll);
			expect(result.success).toBe(true);
		});
	});

	describe('MessageSchema (Discriminated Union)', () => {
		it('should validate all message types', () => {
			const messages = [
				createVoteMessage(),
				createPollUpdateMessage(),
				{ type: 'room-list-request' },
				{ type: 'room-list', rooms: [] }
			];

			messages.forEach((message) => {
				const result = MessageSchema.safeParse(message);
				expect(result.success).toBe(true);
			});
		});

		it('should reject unknown message type', () => {
			const invalidMessage = { type: 'unknown-type', data: 'test' };
			const result = MessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});

		it('should reject malformed JSON', () => {
			const invalidMessage = { notAValidMessage: true };
			const result = MessageSchema.safeParse(invalidMessage);
			expect(result.success).toBe(false);
		});
	});
});
