import type * as Party from 'partykit/server';
import { z } from 'zod';
import {
	RoomMetadata,
	RoomListRequestMessage,
	RoomListMessage,
	MessageSchema,
	Poll,
	RegisterRoomRequestSchema,
	RegisterRoomResponseSchema,
	CreatePollResponseSchema,
	ApiErrorResponseSchema,
	GameListRequestMessage,
	GameListMessage,
	GameMetadata,
	CreateGameRequestSchema,
	CreateGameResponseSchema,
	GetStoriesResponseSchema,
	RegisterGameRequestSchema,
	RegisterGameResponseSchema
} from '../shared/schemas/index';
import { PartyKitServer } from './lib/server';
import { useMessageHandler, useBroadcast, useStorage } from './lib/hooks';
import { generatePollId } from './utils';

type LobbyStorage = {
	roomRegistry: [string, RoomMetadata][];
	gameRegistry: [string, GameMetadata][];
};

export default class LobbyServer extends PartyKitServer {
	private roomRegistry: Map<string, RoomMetadata> = new Map();
	private gameRegistry: Map<string, GameMetadata> = new Map();
	private storage = useStorage<LobbyStorage>(this.room);
	private roomBroadcast = useBroadcast<RoomListMessage>(this.room);
	private gameBroadcast = useBroadcast<GameListMessage>(this.room);
	private messageHandler = useMessageHandler(MessageSchema, this.room);

	async setup() {
		// Load room registry from storage
		const storedRegistry = await this.storage.get('roomRegistry');
		if (storedRegistry) {
			this.roomRegistry = new Map(storedRegistry);
			console.log(`Loaded ${this.roomRegistry.size} rooms from storage`);
		}

		// Load game registry from storage
		const storedGameRegistry = await this.storage.get('gameRegistry');
		if (storedGameRegistry) {
			this.gameRegistry = new Map(storedGameRegistry);
			console.log(`Loaded ${this.gameRegistry.size} games from storage`);
		}

		// Set up message handlers
		this.messageHandler.handle('room-list-request', async (message, sender) => {
			this.sendRoomList(sender);
		});

		this.messageHandler.handle('game-list-request', async (message, sender) => {
			this.sendGameList(sender);
		});
	}

	async handleMessage(message: string, sender: Party.Connection) {
		await this.messageHandler.processMessage(message, sender);
	}

	async handleRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);
		console.log(`Lobby received ${req.method} request to: ${url.pathname}`);

		// Room registration (legacy polls)
		if (req.method === 'POST' && url.pathname.endsWith('/register')) {
			return this.handleRoomRegistration(req);
		}

		// Room unregistration (legacy polls)
		if (req.method === 'DELETE' && url.pathname.includes('/unregister/')) {
			return this.handleRoomUnregistration(url);
		}

		// Poll creation (legacy)
		if (req.method === 'POST' && url.pathname.endsWith('/create-poll')) {
			return this.handlePollCreation(req);
		}

		// Game creation
		if (req.method === 'POST' && url.pathname.endsWith('/create-game')) {
			return this.handleGameCreation(req);
		}

		// Game registration
		if (req.method === 'POST' && url.pathname.endsWith('/register-game')) {
			return this.handleGameRegistration(req);
		}

		// Game unregistration
		if (req.method === 'DELETE' && url.pathname.includes('/unregister-game/')) {
			return this.handleGameUnregistration(url);
		}

		// Get stories
		if (req.method === 'GET' && url.pathname.endsWith('/stories')) {
			return this.handleGetStories(req);
		}

		return this.http.methodNotAllowed();
	}

	protected async onConnectionOpen(conn: Party.Connection) {
		console.log('New connection to lobby:', conn.id);
		this.sendRoomList(conn);
		this.sendGameList(conn);
	}

	// Private methods
	private sendRoomList(conn: Party.Connection) {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		this.roomBroadcast.send(conn, message);
	}

	private broadcastRoomList() {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		this.roomBroadcast.broadcast(message);
	}

	private sendGameList(conn: Party.Connection) {
		const games = Array.from(this.gameRegistry.values());
		const message: GameListMessage = {
			type: 'game-list',
			games: games
		};

		this.gameBroadcast.send(conn, message);
	}

	private broadcastGameList() {
		const games = Array.from(this.gameRegistry.values());
		const message: GameListMessage = {
			type: 'game-list',
			games: games
		};

		this.gameBroadcast.broadcast(message);
	}

	private async saveRegistry() {
		const registryArray = Array.from(this.roomRegistry.entries());
		const gameRegistryArray = Array.from(this.gameRegistry.entries());
		await this.storage.set('roomRegistry', registryArray);
		await this.storage.set('gameRegistry', gameRegistryArray);
	}

	private async handleRoomRegistration(req: Party.Request): Promise<Response> {
		try {
			const requestData = await req.json();
			const roomData = RegisterRoomRequestSchema.parse(requestData);

			// Create room metadata
			const roomMetadata: RoomMetadata = {
				id: roomData.id,
				title: roomData.title,
				createdAt: new Date().toISOString(),
				activeConnections: 0,
				totalVotes: 0
			};

			// Add room to registry
			this.roomRegistry.set(roomData.id, roomMetadata);

			// Save registry to storage
			await this.saveRegistry();

			// Broadcast updated room list
			this.broadcastRoomList();

			console.log(`Registered room: ${roomData.id} - ${roomData.title}`);

			const response = RegisterRoomResponseSchema.parse({ success: true });
			return this.http.success(response);
		} catch (error) {
			console.error('Error registering room:', error);
			const errorResponse = ApiErrorResponseSchema.parse({
				error: 'registration_failed',
				message: 'Failed to register room'
			});
			return this.http.error(errorResponse.message, 500);
		}
	}

	private async handleRoomUnregistration(url: URL): Promise<Response> {
		const roomId = url.pathname.split('/').pop();

		if (roomId && this.roomRegistry.has(roomId)) {
			this.roomRegistry.delete(roomId);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastRoomList();

			console.log(`Unregistered room: ${roomId}`);

			return this.http.success({ message: 'Room unregistered' });
		}

		return this.http.notFound('Room not found');
	}

	private async handlePollCreation(req: Party.Request): Promise<Response> {
		try {
			// Consume the request body
			await req.json().catch(() => ({}));

			// Generate a random poll ID
			const pollId = generatePollId();
			console.log(`Creating new poll with ID: ${pollId}`);

			// Use context.parties to create poll in poll server
			const pollParty = this.room.context.parties.poll;
			const pollRoom = pollParty.get(pollId);

			// Create the poll by making a POST request to the poll server
			const pollResponse = await pollRoom.fetch({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			});

			if (!pollResponse.ok) {
				console.error('Failed to create poll, status:', pollResponse.status);
				return this.http.error('Poll creation failed', 500);
			}

			const pollResponseData = await pollResponse.json();
			const validatedPollResponse = CreatePollResponseSchema.parse(pollResponseData);

			if (!validatedPollResponse.success || !validatedPollResponse.poll) {
				console.error(`Poll creation failed: ${validatedPollResponse.error}`);
				return this.http.error('Poll creation failed', 500);
			}

			const poll = validatedPollResponse.poll;

			// Register the poll room with actual poll metadata
			const roomMetadata: RoomMetadata = {
				id: pollId,
				title: poll.title,
				createdAt: new Date().toISOString(),
				activeConnections: 0,
				totalVotes: 0
			};

			// Add to registry
			this.roomRegistry.set(pollId, roomMetadata);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastRoomList();

			// Return validated response
			const response = CreatePollResponseSchema.parse({
				success: true,
				poll: poll
			});
			return this.http.success(response);
		} catch (error) {
			console.error('Error creating poll:', error);
			return this.http.error('Failed to create poll', 500);
		}
	}

	private async handleGameCreation(req: Party.Request): Promise<Response> {
		try {
			const requestData = await req.json();
			console.log('Game creation request data:', JSON.stringify(requestData, null, 2));
			
			// Add defensive avatar validation
			if (requestData.creator?.avatar) {
				const avatar = requestData.creator.avatar;
				if (!avatar.backgroundColor) {
					avatar.backgroundColor = 'f0f0f0'; // Default background color
				}
				if (!avatar.backgroundType) {
					avatar.backgroundType = 'solid'; // Default background type
				}
			}
			
			const gameRequest = CreateGameRequestSchema.parse(requestData);

			// Generate a random game ID
			const gameId = generatePollId(); // Reuse the same ID generator
			console.log(`Creating new game with ID: ${gameId}`);

			// Use context.parties to create game in game server
			const gameParty = this.room.context.parties.game;
			const gameRoom = gameParty.get(gameId);

			// Create the game by making a POST request to the game server
			const gameResponse = await gameRoom.fetch({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(gameRequest)
			});

			if (!gameResponse.ok) {
				console.error('Failed to create game, status:', gameResponse.status);
				return this.http.error('Game creation failed', 500);
			}

			const gameResponseData = await gameResponse.json();
			const validatedGameResponse = CreateGameResponseSchema.parse(gameResponseData);

			if (!validatedGameResponse.success || !validatedGameResponse.game) {
				console.error(`Game creation failed: ${validatedGameResponse.error}`);
				return this.http.error('Game creation failed', 500);
			}

			const game = validatedGameResponse.game;

			// Create game metadata for lobby
			const gameMetadata: GameMetadata = {
				id: gameId,
				title: game.title,
				storyTitle: game.title, // Will be updated when story is loaded
				genre: 'adventure', // Will be updated when story is loaded
				difficulty: 'medium', // Will be updated when story is loaded
				createdAt: game.createdAt,
				currentScene: game.currentScene,
				isActive: game.isActive,
				isCompleted: game.isCompleted,
				playerCount: game.players.length,
				maxPlayers: game.maxPlayers,
				estimatedTime: 30, // Will be updated when story is loaded
				requiresVoting: game.requiresVoting,
				creator: game.creator
			};

			// Add to game registry
			this.gameRegistry.set(gameId, gameMetadata);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastGameList();

			// Return validated response
			const response = CreateGameResponseSchema.parse({
				success: true,
				game: game
			});
			return this.http.success(response);
		} catch (error) {
			console.error('Error creating game:', error);
			if (error instanceof z.ZodError) {
				console.error('Validation errors:', error.errors ? JSON.stringify(error.errors, null, 2) : 'No error details available');
				const errorMessages = error.errors?.map((e) => e.message).join(', ') || 'Validation failed';
				return this.http.error(
					`Validation failed: ${errorMessages}`,
					400
				);
			}
			return this.http.error('Failed to create game', 500);
		}
	}

	private async handleGameRegistration(req: Party.Request): Promise<Response> {
		try {
			const requestData = await req.json();
			const gameData = RegisterGameRequestSchema.parse(requestData);

			// Create game metadata
			const gameMetadata: GameMetadata = {
				id: gameData.id,
				title: gameData.title,
				storyTitle: gameData.storyTitle,
				genre: gameData.genre,
				difficulty: gameData.difficulty,
				createdAt: new Date().toISOString(),
				currentScene: 'start',
				isActive: true,
				isCompleted: false,
				playerCount: 0,
				maxPlayers: 20,
				estimatedTime: 30,
				requiresVoting: true,
				creator: gameData.creator
			};

			// Add game to registry
			this.gameRegistry.set(gameData.id, gameMetadata);

			// Save registry to storage
			await this.saveRegistry();

			// Broadcast updated game list
			this.broadcastGameList();

			console.log(`Registered game: ${gameData.id} - ${gameData.title}`);

			const response = RegisterGameResponseSchema.parse({ success: true });
			return this.http.success(response);
		} catch (error) {
			console.error('Error registering game:', error);
			const errorResponse = ApiErrorResponseSchema.parse({
				error: 'registration_failed',
				message: 'Failed to register game'
			});
			return this.http.error(errorResponse.message, 500);
		}
	}

	private async handleGameUnregistration(url: URL): Promise<Response> {
		const gameId = url.pathname.split('/').pop();

		if (gameId && this.gameRegistry.has(gameId)) {
			this.gameRegistry.delete(gameId);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastGameList();

			console.log(`Unregistered game: ${gameId}`);

			return this.http.success({ message: 'Game unregistered' });
		}

		return this.http.notFound('Game not found');
	}

	private async handleGetStories(req: Party.Request): Promise<Response> {
		try {
			// For now, return a hardcoded list of stories
			// In a real implementation, this would load from a database or file
			const stories = [
				{
					id: 'fantasy-adventure',
					title: 'The Enchanted Forest',
					description:
						'A magical adventure through an enchanted forest filled with mystical creatures and ancient secrets.',
					genre: 'fantasy',
					difficulty: 'easy',
					estimatedTime: 30
				},
				{
					id: 'sci-fi-station',
					title: 'Space Station Alpha',
					description:
						'A thrilling sci-fi adventure aboard a space station where things are not as they seem.',
					genre: 'sci-fi',
					difficulty: 'medium',
					estimatedTime: 45
				},
				{
					id: 'horror-mansion',
					title: 'The Haunted Mansion',
					description: 'A spine-chilling horror mystery in an abandoned mansion with dark secrets.',
					genre: 'horror',
					difficulty: 'hard',
					estimatedTime: 60
				},
				{
					id: 'mystery-detective',
					title: 'The Case of the Missing Artifact',
					description:
						'A detective mystery where you must solve the case of a stolen ancient artifact.',
					genre: 'mystery',
					difficulty: 'medium',
					estimatedTime: 40
				},
				{
					id: 'comedy-office',
					title: 'Office Shenanigans',
					description: 'A lighthearted comedy adventure in a quirky office environment.',
					genre: 'comedy',
					difficulty: 'easy',
					estimatedTime: 25
				}
			];

			const response = GetStoriesResponseSchema.parse({ stories });
			return this.http.success(response);
		} catch (error) {
			console.error('Error getting stories:', error);
			return this.http.error('Failed to get stories', 500);
		}
	}
}

LobbyServer satisfies Party.Worker;
