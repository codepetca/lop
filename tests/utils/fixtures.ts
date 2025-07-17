import type { Poll } from '$shared/schemas/poll';
import type { VoteMessage, PollUpdateMessage, RoomMetadata } from '$shared/schemas/message';
import type {
	GameSession,
	GameMetadata,
	StoryTemplate,
	StoryScene,
	StoryChoice,
	CharacterState,
	VoteResult
} from '$shared/schemas/game';

/**
 * Centralized test data generators - easy to update when schemas change
 */

export const createTestPoll = (overrides: Partial<Poll> = {}): Poll => ({
	id: 'test-poll-123',
	title: 'What is your favorite color?',
	options: ['Red', 'Blue', 'Green', 'Yellow'],
	votes: { Red: [], Blue: [], Green: [], Yellow: [] },
	players: [],
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
	playerId: 'test-player-uuid-123',
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

// Game fixtures
export const createTestStoryChoice = (overrides: Partial<StoryChoice> = {}): StoryChoice => ({
	id: 'choice-1',
	text: 'Go through the dark forest',
	nextScene: 'forest-scene',
	requirements: {},
	effects: {},
	addItems: [],
	removeItems: [],
	...overrides
});

export const createTestStoryScene = (overrides: Partial<StoryScene> = {}): StoryScene => ({
	id: 'start-scene',
	title: 'The Beginning',
	description: 'You stand at the entrance of a mysterious forest...',
	choices: [
		createTestStoryChoice(),
		createTestStoryChoice({
			id: 'choice-2',
			text: 'Take the mountain path',
			nextScene: 'mountain-scene'
		})
	],
	isEnding: false,
	requirements: {},
	...overrides
});

export const createTestStoryTemplate = (overrides: Partial<StoryTemplate> = {}): StoryTemplate => ({
	id: 'fantasy-adventure',
	title: 'The Enchanted Forest',
	description: 'A magical adventure through an enchanted forest',
	genre: 'fantasy',
	difficulty: 'easy',
	estimatedTime: 30,
	startingScene: 'start-scene',
	scenes: [
		createTestStoryScene(),
		createTestStoryScene({ id: 'forest-scene', title: 'Dark Forest' }),
		createTestStoryScene({ id: 'mountain-scene', title: 'Mountain Path' })
	],
	initialStats: { health: 100, coins: 10 },
	initialInventory: ['torch'],
	...overrides
});

export const createTestCharacterState = (
	overrides: Partial<CharacterState> = {}
): CharacterState => ({
	id: 'player-1',
	name: 'Alice',
	joinedAt: new Date().toISOString(),
	stats: { health: 100, coins: 10 },
	inventory: ['torch'],
	choices: [],
	currentScene: 'start-scene',
	...overrides
});

export const createTestGameSession = (overrides: Partial<GameSession> = {}): GameSession => ({
	id: 'game-123',
	storyId: 'fantasy-adventure',
	title: 'The Enchanted Forest',
	createdAt: new Date().toISOString(),
	currentScene: 'start-scene',
	isActive: true,
	isCompleted: false,
	players: [createTestCharacterState()],
	votingOptions: [createTestStoryChoice()],
	votes: { 'choice-1': 0 },
	votingEndsAt: null,
	maxPlayers: 20,
	requiresVoting: true,
	settings: {
		votingTimeLimit: 60,
		allowSpectators: true,
		showVoteCount: true
	},
	...overrides
});

export const createTestGameMetadata = (overrides: Partial<GameMetadata> = {}): GameMetadata => ({
	id: 'game-123',
	title: 'The Enchanted Forest',
	storyTitle: 'The Enchanted Forest',
	genre: 'fantasy',
	difficulty: 'easy',
	createdAt: new Date().toISOString(),
	currentScene: 'start-scene',
	isActive: true,
	isCompleted: false,
	playerCount: 1,
	maxPlayers: 20,
	estimatedTime: 30,
	requiresVoting: true,
	...overrides
});

export const createTestVoteResult = (overrides: Partial<VoteResult> = {}): VoteResult => ({
	winningChoice: createTestStoryChoice(),
	totalVotes: 5,
	choiceVotes: { 'choice-1': 3, 'choice-2': 2 },
	nextScene: 'forest-scene',
	...overrides
});

// Test stories for different genres
export const testStories = [
	createTestStoryTemplate(),
	createTestStoryTemplate({
		id: 'sci-fi-adventure',
		title: 'Space Station Alpha',
		description: 'A thrilling sci-fi adventure on a space station',
		genre: 'sci-fi',
		difficulty: 'medium',
		estimatedTime: 45
	}),
	createTestStoryTemplate({
		id: 'horror-mystery',
		title: 'The Haunted Mansion',
		description: 'A spine-chilling horror mystery',
		genre: 'horror',
		difficulty: 'hard',
		estimatedTime: 60
	})
];

// Test game message fixtures
export const createGameChoiceMessage = (overrides = {}) => ({
	type: 'game-choice' as const,
	choiceId: 'choice-1',
	playerId: 'player-1',
	...overrides
});

export const createGameUpdateMessage = (game?: GameSession) => ({
	type: 'game-update' as const,
	game: game || createTestGameSession()
});

export const createPlayerJoinMessage = (overrides = {}) => ({
	type: 'player-join' as const,
	playerName: 'Alice',
	playerId: 'player-1',
	...overrides
});

export const createVotingStartedMessage = (overrides = {}) => ({
	type: 'voting-started' as const,
	choices: [createTestStoryChoice()],
	timeLimit: 60,
	endsAt: new Date(Date.now() + 60000).toISOString(),
	...overrides
});

export const createGameCompletedMessage = (overrides = {}) => ({
	type: 'game-completed' as const,
	finalStats: { health: 85, coins: 25 },
	...overrides
});
