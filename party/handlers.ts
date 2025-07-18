import type * as Party from 'partykit/server';
import {
	Poll,
	PollPlayer,
	VoteMessage,
	PollUpdateMessage,
	PlayerJoinPollMessage,
	PlayerJoinedPollMessage,
	PollSchema,
	RoomMetadata,
	RegisterRoomRequestSchema,
	GameSession,
	GameSessionSchema,
	GameChoiceMessage,
	PlayerJoinMessage,
	CharacterState,
	CharacterStateSchema,
	StoryTemplate,
	StoryScene,
	StoryChoice,
	VoteResult,
	CreateGameRequest,
	RegisterGameRequestSchema
} from '$shared/schemas';
import { getRandomQuestion } from './questions';
import { initializePollVotes, generatePollId, generatePlayerId } from './utils';
import { generatePlayerName } from './name-generator';
import { getLobbyUrl } from './lib/config';
import { useStorage, useBroadcast, useHttpResponse } from './lib/hooks';
import { getStoryTemplate, getStoryScene } from './stories';

/**
 * Handle vote messages from WebSocket clients with UUID tracking
 */
export async function handleVote(
	room: Party.Room,
	poll: Poll,
	message: VoteMessage
): Promise<Poll | null> {
	// Check if the option exists in the poll
	if (!poll.options.includes(message.option)) {
		console.warn(`Invalid vote option: ${message.option}`);
		return null;
	}

	// Check if player exists in the poll
	const player = poll.players.find((p) => p.id === message.playerId);
	if (!player) {
		console.warn(`Player not found: ${message.playerId}`);
		return null;
	}

	// Check if player has already voted for any option
	const hasVoted = Object.values(poll.votes).some((voterIds) =>
		voterIds.includes(message.playerId)
	);
	if (hasVoted) {
		console.warn(`Player ${message.playerId} has already voted`);
		return null;
	}

	// Add player's vote to the option
	if (!poll.votes[message.option]) {
		poll.votes[message.option] = [];
	}
	poll.votes[message.option].push(message.playerId);

	// Use hooks for consistent storage and broadcasting
	const storage = useStorage<{ poll: Poll }>(room);
	const { broadcast } = useBroadcast<PollUpdateMessage>(room);

	// Save updated poll to storage
	await storage.set('poll', poll);

	// Broadcast updated poll to all connected clients
	const updateMessage: PollUpdateMessage = {
		type: 'poll-update',
		poll: poll
	};
	broadcast(updateMessage);

	return poll;
}

/**
 * Handle player joining a poll
 */
export async function handlePlayerJoinPoll(
	room: Party.Room,
	poll: Poll,
	message: PlayerJoinPollMessage
): Promise<{ updatedPoll?: Poll; player?: PollPlayer; error?: string }> {
	// Generate player ID and name if not provided
	const playerId = message.playerId || generatePlayerId();
	const playerName = message.playerName || generatePlayerName();

	// Check if player name is already taken
	if (poll.players.some((p) => p.name === playerName)) {
		return { error: 'Player name is already taken' };
	}

	// Check if player ID already exists
	if (poll.players.some((p) => p.id === playerId)) {
		return { error: 'Player ID already exists' };
	}

	// Create new player
	const player: PollPlayer = {
		id: playerId,
		name: playerName,
		joinedAt: new Date().toISOString()
	};

	// Add player to poll
	const updatedPoll = {
		...poll,
		players: [...poll.players, player]
	};

	// Use hooks for consistent storage and broadcasting
	const storage = useStorage<{ poll: Poll }>(room);
	const { broadcast } = useBroadcast<PlayerJoinedPollMessage>(room);

	// Save updated poll to storage
	await storage.set('poll', updatedPoll);

	// Broadcast player joined message to all connected clients
	const joinedMessage: PlayerJoinedPollMessage = {
		type: 'player-joined-poll',
		player: player
	};
	broadcast(joinedMessage);

	return { updatedPoll, player };
}

/**
 * Handle server-generated poll creation
 */
export async function handleCreatePollServerGenerated(room: Party.Room): Promise<Poll> {
	// Get a random question from the bank
	const question = getRandomQuestion();

	// Create new poll with server-generated content
	const poll: Poll = {
		id: room.id,
		title: question.title,
		options: question.options,
		votes: initializePollVotes(question.options),
		players: []
	};

	// Validate the created poll
	const validatedPoll = PollSchema.parse(poll);

	// Use hooks for consistent storage
	const storage = useStorage<{ poll: Poll }>(room);
	await storage.set('poll', validatedPoll);

	// Register with lobby (don't await to avoid blocking poll creation)
	registerRoomWithLobby(validatedPoll).catch((error) => {
		console.error('Failed to register room with lobby:', error);
	});

	return validatedPoll;
}

/**
 * Handle server-generated poll creation without lobby registration
 * Used when poll is created via lobby using context.parties
 */
export async function handleCreatePollServerGeneratedNoRegistration(
	room: Party.Room
): Promise<Poll> {
	// Get a random question from the bank
	const question = getRandomQuestion();

	// Create new poll with server-generated content
	const poll: Poll = {
		id: room.id,
		title: question.title,
		options: question.options,
		votes: initializePollVotes(question.options),
		players: []
	};

	// Validate the created poll
	const validatedPoll = PollSchema.parse(poll);

	// Use hooks for consistent storage
	const storage = useStorage<{ poll: Poll }>(room);
	await storage.set('poll', validatedPoll);

	// No lobby registration - handled by lobby itself
	return validatedPoll;
}

/**
 * Register room with lobby
 */
export async function registerRoomWithLobby(poll: Poll): Promise<void> {
	try {
		const roomData = RegisterRoomRequestSchema.parse({
			id: poll.id,
			title: poll.title
		});

		// Get lobby URL using centralized config
		const lobbyUrl = getLobbyUrl('/register');

		const response = await fetch(lobbyUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(roomData)
		});

		if (response.ok) {
			console.log(`Successfully registered room ${poll.id} with lobby`);
		} else {
			console.error(`Failed to register room ${poll.id} with lobby:`, response.status);
		}
	} catch (error) {
		console.error('Error registering room with lobby:', error);
	}
}

/**
 * Handle GET poll requests
 */
export function handleGetPoll(poll: Poll | null): Response {
	const { success, notFound } = useHttpResponse();

	if (poll) {
		return success(poll);
	} else {
		return notFound('Poll not found');
	}
}

// Game-related handlers

/**
 * Handle game creation
 */
export async function handleCreateGame(
	room: Party.Room,
	request: CreateGameRequest
): Promise<GameSession> {
	// Get story template
	const storyTemplate = getStoryTemplate(request.storyId);
	if (!storyTemplate) {
		throw new Error(`Story template not found: ${request.storyId}`);
	}

	// Get starting scene
	const startingScene = getStoryScene(storyTemplate, storyTemplate.startingScene);
	if (!startingScene) {
		throw new Error(`Starting scene not found: ${storyTemplate.startingScene}`);
	}

	// Create game session
	const gameSession: GameSession = {
		id: room.id,
		storyId: request.storyId,
		title: request.title || storyTemplate.title,
		createdAt: new Date().toISOString(),
		currentScene: storyTemplate.startingScene,
		isActive: true,
		isCompleted: false,
		players: [],
		votingOptions: startingScene.choices,
		votes: {},
		votingEndsAt: null,
		maxPlayers: request.maxPlayers || 6,
		requiresVoting: true,
		settings: {
			votingTimeLimit: request.settings?.votingTimeLimit || 60,
			allowSpectators:
				request.settings?.allowSpectators !== undefined ? request.settings.allowSpectators : true,
			showVoteCount:
				request.settings?.showVoteCount !== undefined ? request.settings.showVoteCount : true
		}
	};

	// Validate the created game
	const validatedGame = GameSessionSchema.parse(gameSession);

	// Use hooks for consistent storage
	const storage = useStorage<{ game: GameSession }>(room);
	await storage.set('game', validatedGame);

	// Register with lobby (don't await to avoid blocking game creation)
	registerGameWithLobby(validatedGame, storyTemplate).catch((error) => {
		console.error('Failed to register game with lobby:', error);
	});

	return validatedGame;
}

/**
 * Handle player joining a game
 */
export async function handlePlayerJoin(
	room: Party.Room,
	game: GameSession,
	message: PlayerJoinMessage,
	connectionId: string
): Promise<{
	updatedGame?: GameSession;
	player?: CharacterState;
	error?: { code: string; message: string };
}> {
	// Check if game is full
	if (game.players.length >= game.maxPlayers) {
		return {
			error: { code: 'game_full', message: 'Game is full' }
		};
	}

	// Check if game is active
	if (!game.isActive) {
		return {
			error: { code: 'game_inactive', message: 'Game is not active' }
		};
	}

	// Check if player name is already taken
	if (game.players.some((p) => p.name === message.playerName)) {
		return {
			error: { code: 'name_taken', message: 'Player name is already taken' }
		};
	}

	// Get story template for initial stats
	const storyTemplate = getStoryTemplate(game.storyId);
	if (!storyTemplate) {
		return {
			error: { code: 'story_not_found', message: 'Story template not found' }
		};
	}

	// Create new player
	const playerId = message.playerId || generatePlayerId();
	const player: CharacterState = {
		id: playerId,
		name: message.playerName,
		joinedAt: new Date().toISOString(),
		stats: { ...storyTemplate.initialStats },
		inventory: [...storyTemplate.initialInventory],
		choices: [],
		currentScene: game.currentScene
	};

	// Validate player
	const validatedPlayer = CharacterStateSchema.parse(player);

	// Add player to game
	const updatedGame = {
		...game,
		players: [...game.players, validatedPlayer]
	};

	// Use hooks for consistent storage
	const storage = useStorage<{ game: GameSession }>(room);
	await storage.set('game', updatedGame);

	return {
		updatedGame,
		player: validatedPlayer
	};
}

/**
 * Handle player leaving a game
 */
export async function handlePlayerLeave(
	room: Party.Room,
	game: GameSession,
	playerId: string
): Promise<{
	updatedGame?: GameSession;
	error?: { code: string; message: string };
}> {
	// Find player
	const playerIndex = game.players.findIndex((p) => p.id === playerId);
	if (playerIndex === -1) {
		return {
			error: { code: 'player_not_found', message: 'Player not found' }
		};
	}

	// Remove player from game
	const updatedGame = {
		...game,
		players: game.players.filter((p) => p.id !== playerId)
	};

	// Use hooks for consistent storage
	const storage = useStorage<{ game: GameSession }>(room);
	await storage.set('game', updatedGame);

	return {
		updatedGame
	};
}

/**
 * Handle game choice/voting
 */
export async function handleGameChoice(
	room: Party.Room,
	game: GameSession,
	message: GameChoiceMessage,
	playerId: string
): Promise<{
	updatedGame?: GameSession;
	voteResult?: VoteResult;
	sceneTransition?: {
		currentScene: string;
		title: string;
		description: string;
		isEnding: boolean;
	};
	gameCompleted?: boolean;
	finalStats?: Record<string, number>;
	error?: { code: string; message: string };
}> {
	// Check if game is active
	if (!game.isActive) {
		return {
			error: { code: 'game_inactive', message: 'Game is not active' }
		};
	}

	// Check if player is in the game
	const player = game.players.find((p) => p.id === playerId);
	if (!player) {
		return {
			error: { code: 'player_not_found', message: 'Player not found in game' }
		};
	}

	// Check if choice is valid
	const choice = game.votingOptions.find((c) => c.id === message.choiceId);
	if (!choice) {
		return {
			error: { code: 'invalid_choice', message: 'Invalid choice' }
		};
	}

	// Check choice requirements
	if (choice.requirements) {
		for (const [stat, required] of Object.entries(choice.requirements)) {
			if ((player.stats[stat] || 0) < required) {
				return {
					error: { code: 'requirements_not_met', message: `Requires ${stat}: ${required}` }
				};
			}
		}
	}

	// Update votes
	const updatedVotes = {
		...game.votes,
		[message.choiceId]: (game.votes[message.choiceId] || 0) + 1
	};

	// Initialize updated game with new votes
	let updatedGame = {
		...game,
		votes: updatedVotes
	};

	// Check if voting is complete
	let voteResult: VoteResult | undefined;
	let sceneTransition: any;
	let gameCompleted = false;
	let finalStats: Record<string, number> | undefined;

	if (game.requiresVoting) {
		const totalVotes = Object.values(updatedVotes).reduce((sum, count) => sum + count, 0);
		const votingTimeLimit = game.settings.votingTimeLimit || 30; // Default 30 seconds

		console.log(`Vote processed: ${totalVotes}/${game.players.length} players voted`);

		// Start voting timer if this is the first vote and no timer is set
		if (totalVotes === 1 && !game.votingEndsAt) {
			const votingEndsAt = new Date(Date.now() + votingTimeLimit * 1000).toISOString();
			updatedGame.votingEndsAt = votingEndsAt;
			console.log('Started voting timer, ends at:', votingEndsAt);
		}

		// Check if voting should end: all players voted OR time expired
		const allPlayersVoted = totalVotes >= game.players.length;
		const timeExpired = game.votingEndsAt && new Date() >= new Date(game.votingEndsAt);

		console.log('Voting check:', { allPlayersVoted, timeExpired, votingEndsAt: game.votingEndsAt });

		if (allPlayersVoted || timeExpired) {
			console.log('Voting complete! Processing results...');
			// Find winning choice (most votes, with tie-breaking)
			const winningChoiceId = Object.entries(updatedVotes).reduce((a, b) =>
				updatedVotes[a[0]] > updatedVotes[b[0]] ? a : b
			)[0];

			const winningChoice = game.votingOptions.find((c) => c.id === winningChoiceId);
			if (winningChoice) {
				voteResult = {
					winningChoice,
					totalVotes,
					choiceVotes: updatedVotes,
					nextScene: winningChoice.nextScene
				};

				// Clear voting timer for next round
				updatedGame.votingEndsAt = null;
			}
		}
	} else {
		// Single player - immediate choice resolution
		voteResult = {
			winningChoice: choice,
			totalVotes: 1,
			choiceVotes: updatedVotes,
			nextScene: choice.nextScene
		};
	}

	// Process choice effects and scene transition (updatedGame already initialized above)

	if (voteResult) {
		// Apply choice effects to all players
		const updatedPlayers = game.players.map((p) => ({
			...p,
			stats: {
				...p.stats,
				...Object.fromEntries(
					Object.entries(voteResult!.winningChoice.effects).map(([stat, change]) => [
						stat,
						(p.stats[stat] || 0) + change
					])
				)
			},
			inventory: [
				...p.inventory.filter((item) => !voteResult!.winningChoice.removeItems.includes(item)),
				...voteResult!.winningChoice.addItems
			],
			choices: [...p.choices, voteResult!.winningChoice.id]
		}));

		// Handle scene transition
		if (voteResult.nextScene) {
			const storyTemplate = getStoryTemplate(game.storyId);
			const nextScene = storyTemplate ? getStoryScene(storyTemplate, voteResult.nextScene) : null;

			if (nextScene) {
				sceneTransition = {
					currentScene: voteResult.nextScene,
					title: nextScene.title,
					description: nextScene.description,
					isEnding: nextScene.isEnding
				};

				updatedGame = {
					...updatedGame,
					currentScene: voteResult.nextScene,
					votingOptions: nextScene.choices,
					votes: {},
					players: updatedPlayers.map((p) => ({ ...p, currentScene: voteResult!.nextScene! }))
				};

				// Check if game is completed
				if (nextScene.isEnding) {
					gameCompleted = true;
					finalStats = updatedPlayers.reduce(
						(acc, p) => {
							Object.entries(p.stats).forEach(([stat, value]) => {
								acc[stat] = (acc[stat] || 0) + value;
							});
							return acc;
						},
						{} as Record<string, number>
					);

					updatedGame = {
						...updatedGame,
						isActive: false,
						isCompleted: true
					};
				}
			}
		} else {
			// No next scene - game ends
			gameCompleted = true;
			finalStats = updatedPlayers.reduce(
				(acc, p) => {
					Object.entries(p.stats).forEach(([stat, value]) => {
						acc[stat] = (acc[stat] || 0) + value;
					});
					return acc;
				},
				{} as Record<string, number>
			);

			updatedGame = {
				...updatedGame,
				isActive: false,
				isCompleted: true,
				players: updatedPlayers
			};
		}
	}

	// Use hooks for consistent storage
	const storage = useStorage<{ game: GameSession }>(room);
	await storage.set('game', updatedGame);

	return {
		updatedGame,
		voteResult,
		sceneTransition,
		gameCompleted,
		finalStats
	};
}

/**
 * Register game with lobby
 */
export async function registerGameWithLobby(
	game: GameSession,
	storyTemplate: StoryTemplate
): Promise<void> {
	try {
		const gameData = RegisterGameRequestSchema.parse({
			id: game.id,
			title: game.title,
			storyTitle: storyTemplate.title,
			genre: storyTemplate.genre,
			difficulty: storyTemplate.difficulty
		});

		// Get lobby URL using centralized config
		const lobbyUrl = getLobbyUrl('/parties/main/main/register-game');

		const response = await fetch(lobbyUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(gameData)
		});

		if (response.ok) {
			console.log(`Successfully registered game ${game.id} with lobby`);
		} else {
			console.error(`Failed to register game ${game.id} with lobby:`, response.status);
		}
	} catch (error) {
		console.error('Error registering game with lobby:', error);
	}
}
