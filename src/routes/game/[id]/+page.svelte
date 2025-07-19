<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import type {
		GameSession,
		Message,
		GameChoiceMessage,
		PlayerJoinMessage,
		CharacterState,
		StoryChoice
	} from '$lib/types';
	import { useWebSocket } from '$lib';
	import { store } from '$lib/stores';
	import { GameAvatar } from '$lib';

	let { data }: { data: PageData } = $props();

	let game = $state<GameSession>(data.game);
	let currentPlayer = $state<CharacterState | null>(null);
	let votingTimeLeft = $state(0);
	let votingTimer: ReturnType<typeof setInterval> | null = null;

	// Check if current player has voted using backend data
	const hasVoted = $derived(
		currentPlayer && game.playerVotes && game.playerVotes[currentPlayer.id] ? true : false
	);

	// Initialize WebSocket hook
	const ws = useWebSocket<Message, GameChoiceMessage | PlayerJoinMessage>('game', data.gameId, {
		onOpen: () => console.log('Connected to game'),
		onClose: () => console.log('Disconnected from game')
	});

	// Calculate total votes for current scene
	const totalVotes = $derived(
		Object.values(game.votes).reduce((sum: number, count: number) => sum + count, 0)
	);

	// Calculate voting stats for each choice
	const choiceStats = $derived(
		game.votingOptions.map((choice: StoryChoice) => ({
			choice,
			votes: game.votes[choice.id] || 0,
			percentage: totalVotes > 0 ? ((game.votes[choice.id] || 0) / totalVotes) * 100 : 0
		}))
	);

	// Handle incoming messages
	$effect(() => {
		if (!ws.lastMessage) return;

		console.log('Received message:', ws.lastMessage.type, ws.lastMessage);

		switch (ws.lastMessage.type) {
			case 'game-update':
				game = ws.lastMessage.game;
				console.log('Updated game state:', game);
				break;
			case 'player-joined':
				// Check if this is our player by matching the name from store
				if (store.player && ws.lastMessage.player.name === store.player.name) {
					currentPlayer = ws.lastMessage.player;
				}
				break;
			case 'voting-started':
				votingTimeLeft = ws.lastMessage.timeLimit;
				startVotingTimer();
				console.log('Voting started, time limit:', votingTimeLeft);
				break;
			case 'voting-ended':
				stopVotingTimer();
				break;
			case 'scene-transition':
				break;
			case 'game-completed':
				stopVotingTimer();
				break;
		}
	});

	function startVotingTimer() {
		stopVotingTimer();
		votingTimer = setInterval(() => {
			votingTimeLeft--;
			if (votingTimeLeft <= 0) {
				stopVotingTimer();
			}
		}, 1000);
	}

	function stopVotingTimer() {
		if (votingTimer) {
			clearInterval(votingTimer);
			votingTimer = null;
		}
	}

	function joinGame() {
		if (!ws.isConnected || !store.player) return;

		console.log('Joining game with name:', store.player.name);
		ws.send({
			type: 'player-join',
			playerName: store.player.name,
			playerId: store.player.id,
			avatar: store.player.avatar
		});
	}

	function vote(choiceId: string) {
		console.log('Vote attempt:', {
			connected: ws.isConnected,
			hasVoted,
			currentPlayer: currentPlayer?.name,
			choiceId
		});

		if (!ws.isConnected || hasVoted || !currentPlayer) return;

		ws.send({
			type: 'game-choice',
			choiceId,
			playerId: currentPlayer.id
		});
	}

	function copyGameLink() {
		if (browser) {
			navigator.clipboard.writeText(window.location.href);
			alert('Game link copied to clipboard!');
		}
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		console.log('Initial game state:', game);
		console.log('Game voting options:', game.votingOptions);

		// Initialize player if not exists, then connect and auto-join
		store.initializePlayer();

		// Connect to WebSocket
		ws.connect();

		// Auto-join game once connected
		const unsubscribe = $effect.root(() => {
			$effect(() => {
				if (ws.isConnected && store.player && !currentPlayer) {
					joinGame();
				}
			});
		});

		// Note: Voting status is now managed by backend playerVotes data

		return () => {
			unsubscribe();
			ws.cleanup();
			stopVotingTimer();
		};
	});
</script>

<svelte:head>
	<title>{game.title} - Adventure Game</title>
</svelte:head>

<main class="container">
	{#if !currentPlayer}
		<div class="loading-overlay">
			<div class="loading-modal">
				<h2>Joining Adventure...</h2>
				<p class="game-info">
					<strong>{game.title}</strong>
				</p>
				{#if ws.status === 'connecting'}
					<p class="status">Connecting...</p>
				{:else if ws.status === 'error'}
					<p class="status error">Connection error</p>
				{:else if ws.status === 'connected'}
					<p class="status">Joining game...</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="game-header">
			<div class="game-title">
				<h1>{game.title}</h1>
				<span class="scene-indicator">Scene: {game.currentScene}</span>
			</div>
			<button class="share-btn" onclick={copyGameLink}>📋 Copy Link</button>
		</div>

		{#if ws.status === 'connecting'}
			<div class="status">Connecting to live updates...</div>
		{:else if ws.status === 'error'}
			<div class="status error">Connection error - retrying...</div>
		{/if}

		<div class="players-section">
			<div class="players-avatars">
				{#each game.players as player (player.id)}
					<GameAvatar
						{player}
						isCurrentPlayer={currentPlayer?.id === player.id}
						hasVoted={game.playerVotes && game.playerVotes[player.id] ? true : false}
						onclick={(clickedPlayer: CharacterState) => {
							console.log('Clicked player:', clickedPlayer.name);
							// TODO: Show player details modal
						}}
					/>
				{/each}
			</div>
			<div class="game-stats"></div>
		</div>

		{#if game.isCompleted}
			<div class="game-completed">
				<h2>🎉 Adventure Complete!</h2>
			</div>

			<div class="completion-actions">
				<a href="/" class="back-to-lobby-btn">🏠 Back to Lobby</a>
			</div>
		{:else}
			{#if votingTimeLeft > 0}
				<div class="voting-timer">
					⏱️ Voting ends in {formatTime(votingTimeLeft)}
				</div>
			{/if}

			{#if game.votingOptions.length > 0}
				<div class="story-choices">
					<h3>What happens next?</h3>
					<div class="choices">
						{#each choiceStats as { choice, votes, percentage }}
							<div class="choice">
								<button
									class="choice-btn"
									class:voted={hasVoted}
									onclick={() => vote(choice.id)}
									disabled={hasVoted ||
										ws.status !== 'connected' ||
										(votingTimeLeft <= 0 && votingTimeLeft !== 0)}
								>
									<div class="choice-content">
										<span class="choice-text">{choice.text}</span>
										<span class="choice-votes">{votes}</span>
									</div>

									{#if choice.effects && Object.keys(choice.effects).length > 0}
										<div class="choice-effects">
											{#each Object.entries(choice.effects) as [stat, change]}
												<span class="effect">{stat}: {change > 0 ? '+' : ''}{change}</span>
											{/each}
										</div>
									{/if}

									{#if totalVotes > 0}
										<div class="progress-bar">
											<div class="progress-fill" style="width: {percentage}%"></div>
										</div>
										<span class="percentage">{percentage.toFixed(1)}%</span>
									{/if}
								</button>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="waiting-message">
					<p>⏳ Waiting for the story to continue...</p>
				</div>
			{/if}

			{#if !hasVoted && ws.status === 'connected' && game.votingOptions.length > 0}
				<p class="instruction">Choose your path in the adventure!</p>
			{/if}
		{/if}
	{/if}
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Loading Modal Styles */
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.loading-modal {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.loading-modal h2 {
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.game-info {
		margin-bottom: 1.5rem;
		color: #6b7280;
	}

	/* Game Header */
	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.game-title h1 {
		color: #333;
		margin: 0;
		font-size: 2rem;
	}

	.scene-indicator {
		color: #6b7280;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.share-btn {
		background: #10b981;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.share-btn:hover {
		background: #059669;
	}

	/* Players Section */
	.players-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.players-avatars {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
		overflow-x: auto;
		max-width: 100%;
		padding: 0.25rem 0;
	}

	.players-avatars::-webkit-scrollbar {
		height: 4px;
	}

	.players-avatars::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 2px;
	}

	.players-avatars::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 2px;
	}

	.players-avatars::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.game-stats {
		display: flex;
		gap: 1rem;
		color: #6b7280;
		font-size: 0.9rem;
	}

	/* Status Messages */
	.status {
		text-align: center;
		color: #6b7280;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.status.error {
		color: #dc2626;
	}

	.voting-timer {
		text-align: center;
		background: #fef3c7;
		color: #92400e;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	/* Story Choices */
	.story-choices h3 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 1.3rem;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.choice {
		position: relative;
	}

	.choice-btn {
		width: 100%;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
		text-align: left;
	}

	.choice-btn:hover:not(:disabled) {
		border-color: #6366f1;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
	}

	.choice-btn:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.choice-btn.voted {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.choice-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		position: relative;
		z-index: 2;
		margin-bottom: 0.5rem;
	}

	.choice-text {
		font-size: 1rem;
		color: #374151;
		line-height: 1.4;
		flex: 1;
		margin-right: 1rem;
	}

	.choice-votes {
		font-weight: 600;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.choice-effects {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.effect {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: #e5e7eb;
		border-radius: 0 0 10px 10px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
		border-radius: 0 0 10px 10px;
		transition: width 0.5s ease;
	}

	.percentage {
		position: absolute;
		top: 0.5rem;
		right: 1.5rem;
		font-size: 0.8rem;
		color: #6b7280;
		font-weight: 600;
	}

	.waiting-message {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
		font-style: italic;
	}

	.instruction {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		margin-bottom: 2rem;
	}

	.game-completed {
		text-align: center;
		padding: 3rem;
		background: #f0fdf4;
		border: 2px solid #16a34a;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.game-completed h2 {
		color: #16a34a;
		margin-bottom: 0;
	}

	.completion-actions {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.back-to-lobby-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
		text-decoration: none;
		display: inline-block;
	}

	.back-to-lobby-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}


	@media (max-width: 640px) {
		.container {
			padding: 1rem;
		}

		.game-header {
			flex-direction: column;
			align-items: stretch;
		}

		.players-section {
			flex-direction: column;
			gap: 1rem;
		}

		.players-avatars {
			justify-content: center;
			max-width: none;
		}

		.game-stats {
			justify-content: center;
		}

		.choice-btn {
			padding: 1rem;
		}

		.percentage {
			position: static;
			margin-top: 0.5rem;
			display: block;
		}
	}
</style>
