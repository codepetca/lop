import type { Poll } from '$shared/schemas/poll';
import type { VoteMessage, PollUpdateMessage, RoomMetadata } from '$shared/schemas/message';

/**
 * Centralized test data generators - easy to update when schemas change
 */

export const createTestPoll = (overrides: Partial<Poll> = {}): Poll => ({
	id: 'test-poll-123',
	title: 'What is your favorite color?',
	options: ['Red', 'Blue', 'Green', 'Yellow'],
	votes: { Red: 0, Blue: 0, Green: 0, Yellow: 0 },
	...overrides
});

export const createTestRoomMetadata = (overrides: Partial<RoomMetadata> = {}): RoomMetadata => ({
	id: 'test-room-456',
	title: 'Test Room',
	createdAt: new Date().toISOString(),
	activeConnections: 0,
	totalVotes: 0,
	...overrides
});

export const createVoteMessage = (overrides: Partial<VoteMessage> = {}): VoteMessage => ({
	type: 'vote',
	option: 'Red',
	...overrides
});

export const createPollUpdateMessage = (poll?: Poll): PollUpdateMessage => ({
	type: 'poll-update',
	poll: poll || createTestPoll()
});

export const createRoomListMessage = (rooms: RoomMetadata[] = []) => ({
	type: 'room-list' as const,
	rooms
});

export const createRoomListRequestMessage = () => ({
	type: 'room-list-request' as const
});

// Test question bank
export const testQuestions = [
	{
		title: 'Test Question 1',
		options: ['Option A', 'Option B', 'Option C']
	},
	{
		title: 'Test Question 2',
		options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']
	}
];

// Valid poll IDs for testing
export const validPollIds = ['abc123def', 'xyz789uvw', 'test-poll-1'];

// Invalid poll IDs for testing
export const invalidPollIds = ['', 'too-short', 'way-too-long-poll-id-that-exceeds-limits'];

// Test environment variables
export const testEnv = {
	PARTYKIT_URL: 'http://localhost:1999',
	PUBLIC_PARTYKIT_HOST: 'localhost:1999'
};
