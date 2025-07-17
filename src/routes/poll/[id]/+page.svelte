<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import type { Poll, Message, VoteMessage, PlayerJoinPollMessage, PlayerJoinedPollMessage } from '$lib/types';
	import { useWebSocket } from '$lib/hooks/useWebSocket.svelte';

	let { data }: { data: PageData } = $props();

	let poll = $state<Poll>(data.poll);
	let hasVoted = $state(false);
	let currentPlayer = $state<{ id: string; name: string } | null>(null);

	// Initialize WebSocket hook
	const ws = useWebSocket<Message, VoteMessage | PlayerJoinPollMessage>('poll', data.pollId, {
		onOpen: () => {
			console.log('Connected to PartyKit');
			// Auto-join the poll when connected
			joinPoll();
		},
		onClose: () => console.log('Disconnected from PartyKit')
	});

	// Calculate total votes (now working with arrays of player IDs)
	const totalVotes = $derived(
		Object.values(poll.votes).reduce((sum: number, voterIds: string[]) => sum + voterIds.length, 0)
	);

	// Calculate percentages for each option
	const optionStats = $derived(
		poll.options.map((option: string) => ({
			option,
			votes: poll.votes[option]?.length || 0,
			percentage: totalVotes > 0 ? ((poll.votes[option]?.length || 0) / totalVotes) * 100 : 0
		}))
	);

	// Handle incoming messages
	$effect(() => {
		if (ws.lastMessage?.type === 'poll-update') {
			poll = ws.lastMessage.poll;
			// Check if current player has voted
			if (currentPlayer) {
				hasVoted = Object.values(poll.votes).some(voterIds => voterIds.includes(currentPlayer!.id));
			}
		} else if (ws.lastMessage?.type === 'player-joined-poll') {
			// If this is our player joining, save the data
			const joinedPlayer = ws.lastMessage.player;
			if (!currentPlayer || currentPlayer.id === joinedPlayer.id) {
				currentPlayer = { id: joinedPlayer.id, name: joinedPlayer.name };
				savePlayerToCookies(currentPlayer);
				console.log('Joined as player:', currentPlayer);
			}
		}
	});

	// Player management functions
	function loadPlayerFromCookies(): { id: string; name: string } | null {
		if (!browser) return null;
		try {
			const playerData = localStorage.getItem(`player_${data.pollId}`);
			return playerData ? JSON.parse(playerData) : null;
		} catch {
			return null;
		}
	}

	function savePlayerToCookies(player: { id: string; name: string }) {
		if (browser) {
			localStorage.setItem(`player_${data.pollId}`, JSON.stringify(player));
		}
	}

	function joinPoll() {
		if (!ws.isConnected) return;

		// Try to load existing player data
		const existingPlayer = loadPlayerFromCookies();
		
		ws.send({
			type: 'player-join-poll',
			playerId: existingPlayer?.id,
			playerName: existingPlayer?.name
		});
	}

	function vote(option: string) {
		if (!ws.isConnected || hasVoted || !currentPlayer) return;

		ws.send({
			type: 'vote',
			option,
			playerId: currentPlayer.id
		});
		hasVoted = true;
	}

	function copyPollLink() {
		if (browser) {
			navigator.clipboard.writeText(window.location.href);
			alert('Poll link copied to clipboard!');
		}
	}

	onMount(() => {
		// Load existing player data if available
		const existingPlayer = loadPlayerFromCookies();
		if (existingPlayer) {
			currentPlayer = existingPlayer;
			// Check if this player has already voted in the current poll
			hasVoted = Object.values(poll.votes).some(voterIds => voterIds.includes(existingPlayer.id));
		}

		ws.connect();

		return () => {
			ws.cleanup();
		};
	});
</script>

<svelte:head>
	<title>{poll.title} - Poll</title>
</svelte:head>

<main class="container">
	<div class="poll-header">
		<h1>{poll.title}</h1>
		<button class="share-btn" onclick={copyPollLink}> 📋 Copy Link </button>
	</div>

	{#if ws.status === 'connecting'}
		<div class="status">Connecting to live updates...</div>
	{:else if ws.status === 'error'}
		<div class="status error">Connection error - retrying...</div>
	{/if}

	<div class="poll-stats">
		<div class="stats-left">
			<span class="vote-count">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
			{#if poll.players.length > 0}
				<span class="player-count">{poll.players.length} player{poll.players.length !== 1 ? 's' : ''}</span>
			{/if}
		</div>
		<div class="stats-right">
			{#if currentPlayer}
				<span class="player-name">👤 {currentPlayer.name}</span>
			{/if}
			{#if hasVoted}
				<span class="voted-indicator">✓ Voted</span>
			{/if}
		</div>
	</div>

	<div class="options">
		{#each optionStats as { option, votes, percentage }}
			<div class="option">
				<button
					class="option-btn"
					class:voted={hasVoted}
					onclick={() => vote(option)}
					disabled={hasVoted || ws.status !== 'connected'}
				>
					<div class="option-content">
						<span class="option-text">{option}</span>
						<span class="option-votes">{votes}</span>
					</div>

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

	{#if !hasVoted && ws.status === 'connected'}
		<p class="instruction">Click an option to vote!</p>
	{/if}

	<div class="poll-footer">
		<a href="/" class="create-new-btn">Create New Poll</a>
	</div>
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.poll-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		color: #333;
		margin: 0;
		flex: 1;
		min-width: 200px;
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

	.status {
		text-align: center;
		color: #6b7280;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.status.error {
		color: #dc2626;
	}

	.poll-stats {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.stats-left,
	.stats-right {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.vote-count,
	.player-count {
		font-weight: 600;
		color: #374151;
	}

	.player-count {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.player-name {
		color: #4f46e5;
		font-weight: 500;
	}

	.voted-indicator {
		color: #10b981;
		font-weight: 600;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.option {
		position: relative;
	}

	.option-btn {
		width: 100%;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
	}

	.option-btn:hover:not(:disabled) {
		border-color: #4f46e5;
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
	}

	.option-btn:disabled {
		cursor: not-allowed;
	}

	.option-btn.voted {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.option-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		z-index: 2;
	}

	.option-text {
		font-size: 1.1rem;
		font-weight: 500;
		color: #374151;
	}

	.option-votes {
		font-weight: 600;
		color: #6b7280;
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
		background: linear-gradient(90deg, #4f46e5, #7c3aed);
		border-radius: 0 0 10px 10px;
		transition: width 0.5s ease;
	}

	.percentage {
		position: absolute;
		top: 0.5rem;
		right: 1.5rem;
		font-size: 0.9rem;
		color: #6b7280;
		font-weight: 600;
	}

	.instruction {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		margin-bottom: 2rem;
	}

	.poll-footer {
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

		.poll-header {
			flex-direction: column;
			align-items: stretch;
		}

		.poll-stats {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}

		.stats-left,
		.stats-right {
			justify-content: center;
		}

		.option-btn {
			padding: 1rem;
		}

		.percentage {
			position: static;
			margin-top: 0.5rem;
			display: block;
		}
	}
</style>
