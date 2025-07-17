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
	import { useWebSocket } from '$lib/hooks/useWebSocket.svelte';

	let { data }: { data: PageData } = $props();

	let game = $state<GameSession>(data.game);
	let playerName = $state('');
	let currentPlayer = $state<CharacterState | null>(null);
	let hasVoted = $state(false);
	let joinPrompt = $state(true);
	let votingTimeLeft = $state(0);
	let votingTimer: ReturnType<typeof setInterval> | null = null;

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

		switch (ws.lastMessage.type) {
			case 'game-update':
				game = ws.lastMessage.game;
				break;
			case 'player-joined':
				if (ws.lastMessage.player.name === playerName) {
					currentPlayer = ws.lastMessage.player;
					joinPrompt = false;
				}
				break;
			case 'voting-started':
				hasVoted = false;
				votingTimeLeft = ws.lastMessage.timeLimit;
				startVotingTimer();
				break;
			case 'voting-ended':
				hasVoted = false;
				stopVotingTimer();
				break;
			case 'scene-transition':
				hasVoted = false;
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
		if (!playerName.trim() || !ws.isConnected) return;

		ws.send({
			type: 'player-join',
			playerName: playerName.trim()
		});
	}

	function vote(choiceId: string) {
		if (!ws.isConnected || hasVoted || !currentPlayer) return;

		ws.send({
			type: 'game-choice',
			choiceId,
			playerId: currentPlayer.id
		});
		hasVoted = true;

		// Store vote in localStorage to prevent duplicate votes
		if (browser) {
			localStorage.setItem(`voted_${data.gameId}_${game.currentScene}`, 'true');
		}
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
		ws.connect();

		// Check if user has already voted for current scene
		if (browser) {
			hasVoted = localStorage.getItem(`voted_${data.gameId}_${game.currentScene}`) === 'true';
		}

		return () => {
			ws.cleanup();
			stopVotingTimer();
		};
	});
</script>

<svelte:head>
	<title>{game.title} - Adventure Game</title>
</svelte:head>

<main class="container">
	{#if joinPrompt}
		<div class="join-overlay">
			<div class="join-modal">
				<h2>Join the Adventure</h2>
				<p class="game-info">
					<strong>{game.title}</strong><br />
					{game.players.length}/{game.maxPlayers} players
				</p>
				<form onsubmit={(e) => { e.preventDefault(); joinGame(); }}>
					<input
						type="text"
						placeholder="Enter your name"
						bind:value={playerName}
						maxlength="20"
						required
					/>
					<button type="submit" disabled={!playerName.trim() || ws.status !== 'connected'}>
						Join Game
					</button>
				</form>
				{#if ws.status === 'connecting'}
					<p class="status">Connecting...</p>
				{:else if ws.status === 'error'}
					<p class="status error">Connection error</p>
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

		<div class="game-info-bar">
			<div class="player-info">
				<span class="player-name">👤 {currentPlayer?.name}</span>
				{#if currentPlayer?.stats}
					<div class="player-stats">
						{#each Object.entries(currentPlayer.stats) as [stat, value]}
							<span class="stat">{stat}: {value}</span>
						{/each}
					</div>
				{/if}
			</div>
			<div class="game-stats">
				<span class="players-count">👥 {game.players.length} players</span>
				<span class="votes-count">🗳️ {totalVotes} votes</span>
			</div>
		</div>

		{#if game.isCompleted}
			<div class="game-completed">
				<h2>🎉 Adventure Complete!</h2>
				<p>Thanks for playing! The story has reached its conclusion.</p>
				<a href="/" class="create-new-btn">Create New Game</a>
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
									disabled={hasVoted || ws.status !== 'connected' || votingTimeLeft <= 0}
								>
									<div class="choice-content">
										<span class="choice-text">{choice.text}</span>
										<span class="choice-votes">{votes}</span>
									</div>

									{#if choice.effects && choice.effects.length > 0}
										<div class="choice-effects">
											{#each choice.effects as effect}
												<span class="effect">{effect.stat}: {effect.change > 0 ? '+' : ''}{effect.change}</span>
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

		<div class="game-footer">
			<a href="/" class="create-new-btn">Create New Game</a>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Join Modal Styles */
	.join-overlay {
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

	.join-modal {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		max-width: 400px;
		width: 90%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	}

	.join-modal h2 {
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.game-info {
		margin-bottom: 1.5rem;
		color: #6b7280;
	}

	.join-modal input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		margin-bottom: 1rem;
		box-sizing: border-box;
	}

	.join-modal button {
		width: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem;
		font-size: 1rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.join-modal button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	/* Game Info Bar */
	.game-info-bar {
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

	.player-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.player-name {
		font-weight: 600;
		color: #1f2937;
	}

	.player-stats {
		display: flex;
		gap: 0.5rem;
	}

	.stat {
		background: #e0e7ff;
		color: #3730a3;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
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
		margin-bottom: 1rem;
	}

	.game-footer {
		text-align: center;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.create-new-btn {
		background: #f3f4f6;
		color: #374151;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		transition: background-color 0.2s;
		display: inline-block;
	}

	.create-new-btn:hover {
		background: #e5e7eb;
	}

	@media (max-width: 640px) {
		.container {
			padding: 1rem;
		}

		.game-header {
			flex-direction: column;
			align-items: stretch;
		}

		.game-info-bar {
			flex-direction: column;
			gap: 1rem;
		}

		.player-info,
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