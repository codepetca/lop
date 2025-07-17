import type * as Party from 'partykit/server';
import {
	GameSession,
	GameUpdateMessage,
	MessageSchema,
	GetGameResponseSchema,
	CreateGameResponseSchema,
	JoinGameResponseSchema,
	CharacterState,
	PlayerJoinedMessage,
	PlayerLeftMessage,
	VotingStartedMessage,
	VotingEndedMessage,
	SceneTransitionMessage,
	GameCompletedMessage,
	GameErrorMessage,
	CreateGameRequestSchema,
	JoinGameRequestSchema
} from '../shared/schemas/index.js';
import {
	handleGameChoice,
	handleCreateGame,
	handlePlayerJoin,
	handlePlayerLeave
} from './handlers';
import { PartyKitServer } from './lib/server';
import { useMessageHandler, useBroadcast, useStorage } from './lib/hooks';

type GameStorage = {
	game: GameSession;
};

export default class GameServer extends PartyKitServer {
	private game: GameSession | null = null;
	private storage = useStorage<GameStorage>(this.room);
	private gameBroadcast = useBroadcast<GameUpdateMessage>(this.room);
	private playerBroadcast = useBroadcast<PlayerJoinedMessage | PlayerLeftMessage>(this.room);
	private votingBroadcast = useBroadcast<VotingStartedMessage | VotingEndedMessage>(this.room);
	private sceneBroadcast = useBroadcast<SceneTransitionMessage>(this.room);
	private completeBroadcast = useBroadcast<GameCompletedMessage>(this.room);
	private errorBroadcast = useBroadcast<GameErrorMessage>(this.room);
	private messageHandler = useMessageHandler(MessageSchema, this.room);
	private connectionPlayerMap = new Map<string, string>(); // connectionId -> playerId

	async setup() {
		// Load game from storage
		this.game = await this.storage.get('game');

		// Set up message handlers
		this.messageHandler.handle('game-choice', async (message, sender) => {
			if (!this.game) return;

			const playerId = this.connectionPlayerMap.get(sender.id);
			if (!playerId) {
				this.errorBroadcast.send(sender, {
					type: 'game-error',
					error: 'player_not_found',
					message: 'You must join the game first'
				});
				return;
			}

			const result = await handleGameChoice(this.room, this.game, message, playerId);
			if (result.updatedGame) {
				this.game = result.updatedGame;
				await this.storage.set('game', this.game);

				// Broadcast game update
				this.gameBroadcast.broadcast({
					type: 'game-update',
					game: this.game
				});

				// Handle voting results or scene transitions
				if (result.voteResult) {
					this.votingBroadcast.broadcast({
						type: 'voting-ended',
						result: result.voteResult
					});
				}

				if (result.sceneTransition) {
					this.sceneBroadcast.broadcast({
						type: 'scene-transition',
						currentScene: result.sceneTransition.currentScene,
						title: result.sceneTransition.title,
						description: result.sceneTransition.description,
						isEnding: result.sceneTransition.isEnding
					});
				}

				if (result.gameCompleted) {
					this.completeBroadcast.broadcast({
						type: 'game-completed',
						finalStats: result.finalStats || {}
					});
				}
			}

			if (result.error) {
				this.errorBroadcast.send(sender, {
					type: 'game-error',
					error: result.error.code,
					message: result.error.message
				});
			}
		});

		this.messageHandler.handle('player-join', async (message, sender) => {
			if (!this.game) return;

			const result = await handlePlayerJoin(this.room, this.game, message, sender.id);
			if (result.updatedGame) {
				this.game = result.updatedGame;
				await this.storage.set('game', this.game);

				// Store player mapping
				if (result.player) {
					this.connectionPlayerMap.set(sender.id, result.player.id);

					// Broadcast player joined
					this.playerBroadcast.broadcast({
						type: 'player-joined',
						player: result.player
					});

					// Broadcast game update
					this.gameBroadcast.broadcast({
						type: 'game-update',
						game: this.game
					});
				}
			}

			if (result.error) {
				this.errorBroadcast.send(sender, {
					type: 'game-error',
					error: result.error.code,
					message: result.error.message
				});
			}
		});
	}

	async handleMessage(message: string, sender: Party.Connection) {
		await this.messageHandler.processMessage(message, sender);
	}

	async handleRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST') {
			try {
				const requestData = await req.json();
				const gameRequest = CreateGameRequestSchema.parse(requestData);

				// Create game session
				const game = await handleCreateGame(this.room, gameRequest);
				this.game = game;
				await this.storage.set('game', game);

				const response = CreateGameResponseSchema.parse({
					success: true,
					game: game
				});

				return this.http.success(response);
			} catch (error) {
				console.error('Error creating game:', error);
				const errorResponse = CreateGameResponseSchema.parse({
					success: false,
					error: 'game_creation_failed'
				});
				return this.http.error(errorResponse.error, 500);
			}
		}

		if (req.method === 'GET') {
			const response = GetGameResponseSchema.parse({
				game: this.game
			});
			return this.http.success(response);
		}

		// Handle player join via HTTP
		if (req.method === 'POST' && url.pathname.endsWith('/join')) {
			try {
				const requestData = await req.json();
				const joinRequest = JoinGameRequestSchema.parse(requestData);

				if (!this.game) {
					return this.http.error('Game not found', 404);
				}

				const result = await handlePlayerJoin(
					this.room,
					this.game,
					{
						type: 'player-join',
						playerName: joinRequest.playerName,
						playerId: joinRequest.playerId
					},
					'http-request'
				);

				if (result.updatedGame) {
					this.game = result.updatedGame;
					await this.storage.set('game', this.game);

					// Broadcast updates
					if (result.player) {
						this.playerBroadcast.broadcast({
							type: 'player-joined',
							player: result.player
						});
					}

					this.gameBroadcast.broadcast({
						type: 'game-update',
						game: this.game
					});
				}

				const response = JoinGameResponseSchema.parse({
					success: !result.error,
					playerId: result.player?.id,
					error: result.error?.message
				});

				return this.http.success(response);
			} catch (error) {
				console.error('Error joining game:', error);
				const errorResponse = JoinGameResponseSchema.parse({
					success: false,
					error: 'join_failed'
				});
				return this.http.error(errorResponse.error, 500);
			}
		}

		return this.http.methodNotAllowed();
	}

	// Send current game data to new connections
	protected async onConnectionOpen(conn: Party.Connection) {
		if (this.game) {
			this.gameBroadcast.send(conn, {
				type: 'game-update',
				game: this.game
			});
		}
	}

	// Handle player disconnect
	protected async onConnectionClose(conn: Party.Connection) {
		const playerId = this.connectionPlayerMap.get(conn.id);
		if (playerId && this.game) {
			const result = await handlePlayerLeave(this.room, this.game, playerId);
			if (result.updatedGame) {
				this.game = result.updatedGame;
				await this.storage.set('game', this.game);

				// Broadcast player left
				this.playerBroadcast.broadcast({
					type: 'player-left',
					playerId: playerId
				});

				// Broadcast game update
				this.gameBroadcast.broadcast({
					type: 'game-update',
					game: this.game
				});
			}

			// Remove from connection mapping
			this.connectionPlayerMap.delete(conn.id);
		}
	}
}

GameServer satisfies Party.Worker;
