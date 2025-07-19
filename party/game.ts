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
import { getLobbyUrl } from './lib/config';

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
	private votingTimer: ReturnType<typeof setTimeout> | null = null;

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
			console.log('=== GAME SERVER RECEIVED RESULT ===');
			console.log('result.updatedGame exists:', !!result.updatedGame);
			console.log('result.voteResult exists:', !!result.voteResult);
			console.log('result.sceneTransition exists:', !!result.sceneTransition);
			console.log('result.gameCompleted:', result.gameCompleted);

			if (result.updatedGame) {
				this.game = result.updatedGame;
				await this.storage.set('game', this.game);

				// Start voting timer if one was set
				if (this.game.votingEndsAt && !this.votingTimer) {
					this.startVotingTimer();
				}

				// Broadcast game update
				console.log('Broadcasting game-update message...');
				this.gameBroadcast.broadcast({
					type: 'game-update',
					game: this.game
				});

				// Handle voting results or scene transitions
				if (result.voteResult) {
					// Clear voting timer since voting completed
					this.clearVotingTimer();

					console.log('Broadcasting voting-ended message...');
					this.votingBroadcast.broadcast({
						type: 'voting-ended',
						result: result.voteResult
					});
				}

				if (result.sceneTransition) {
					console.log('Broadcasting scene-transition message:', result.sceneTransition);
					this.sceneBroadcast.broadcast({
						type: 'scene-transition',
						currentScene: result.sceneTransition.currentScene,
						title: result.sceneTransition.title,
						description: result.sceneTransition.description,
						isEnding: result.sceneTransition.isEnding
					});
				} else {
					console.log('No scene transition to broadcast');
				}

				if (result.gameCompleted) {
					console.log('Broadcasting game-completed message...');
					this.completeBroadcast.broadcast({
						type: 'game-completed',
						finalStats: result.finalStats || {}
					});
				}
			} else {
				console.log('No updated game to process');
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

	private startVotingTimer() {
		if (!this.game?.votingEndsAt) return;

		const timeRemaining = new Date(this.game.votingEndsAt).getTime() - Date.now();
		if (timeRemaining <= 0) {
			// Time already expired
			this.processVotingTimeout();
			return;
		}

		// Clear any existing timer
		this.clearVotingTimer();

		// Set new timer
		this.votingTimer = setTimeout(async () => {
			await this.processVotingTimeout();
		}, timeRemaining);

		// Broadcast voting started message
		this.votingBroadcast.broadcast({
			type: 'voting-started',
			choices: this.game!.votingOptions,
			timeLimit: Math.ceil(timeRemaining / 1000),
			endsAt: this.game!.votingEndsAt!
		});
	}

	private clearVotingTimer() {
		if (this.votingTimer) {
			clearTimeout(this.votingTimer);
			this.votingTimer = null;
		}
	}

	private async processVotingTimeout() {
		if (!this.game) return;

		// Check if voting is still active (hasn't been completed already)
		if (!this.game.votingEndsAt) {
			// Voting already completed, no need to process timeout
			return;
		}

		// Process timeout by checking current vote state without fake player
		const totalVotes = Object.values(this.game.votes).reduce((sum, count) => sum + count, 0);
		if (totalVotes > 0) {
			// Force voting completion by setting time as expired
			const updatedGame = {
				...this.game,
				votingEndsAt: new Date(Date.now() - 1000).toISOString() // Force expired
			};

			// Find the most voted choice
			const winningChoiceId = Object.entries(this.game.votes).reduce((a, b) =>
				this.game!.votes[a[0]] > this.game!.votes[b[0]] ? a : b
			)[0];

			// Find a player who hasn't voted yet, or use first player if all have voted
			let triggerPlayer = this.game.players.find(p => !this.game!.playerVotes[p.id]);
			if (!triggerPlayer) {
				triggerPlayer = this.game.players[0];
			}
			if (!triggerPlayer) return;

			// Only process if the player exists and hasn't voted for this choice yet
			if (!this.game.playerVotes[triggerPlayer.id] || this.game.playerVotes[triggerPlayer.id] !== winningChoiceId) {
				const result = await handleGameChoice(
					this.room,
					updatedGame,
					{ type: 'game-choice', choiceId: winningChoiceId, playerId: triggerPlayer.id },
					triggerPlayer.id
				);

				if (result.updatedGame) {
					this.game = result.updatedGame;
					await this.storage.set('game', this.game);

					// Broadcast updates
					this.gameBroadcast.broadcast({
						type: 'game-update',
						game: this.game
					});

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
			}
		}

		this.clearVotingTimer();
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

			if (result.shouldDeleteGame) {
				// Game is completed and no players remain - delete it
				await this.deleteGame();
			} else if (result.updatedGame) {
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

	private async deleteGame() {
		if (!this.game) return;

		const gameId = this.room.id;

		// Clear all game storage
		await this.storage.remove('game');
		this.game = null;

		// Clear voting timer if running
		this.clearVotingTimer();

		// Notify lobby to unregister the game
		try {
			const lobbyUrl = getLobbyUrl(`/parties/main/main/unregister-game/${gameId}`);
			const lobbyResponse = await fetch(lobbyUrl, { method: 'DELETE' });

			if (!lobbyResponse.ok) {
				console.warn(`Failed to unregister game ${gameId} from lobby:`, lobbyResponse.status);
			} else {
				console.log(`Successfully deleted completed game ${gameId}`);
			}
		} catch (error) {
			console.error(`Error notifying lobby of game deletion:`, error);
		}
	}
}

GameServer satisfies Party.Worker;
