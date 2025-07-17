<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ActionData, PageData } from './$types';
	import type { RoomMetadata, GameMetadata, Message, RoomListRequestMessage, GameListRequestMessage } from '$lib/types';
	import { useWebSocket } from '$lib/hooks/useWebSocket.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let loading = $state(false);
	let gameLoading = $state(false);
	let joinRoomId = $state('');
	let activeRooms = $state<RoomMetadata[]>([]);
	let activeGames = $state<GameMetadata[]>([]);
	let selectedStoryId = $state('');
	let gameTitle = $state('');
	let maxPlayers = $state(20);
	let requiresVoting = $state(true);
	let currentTab = $state<'polls' | 'games'>('games');

	// Initialize WebSocket hook for lobby (lobby is main server now)
	const ws = useWebSocket<Message, RoomListRequestMessage | GameListRequestMessage>('main', 'main', {
		onOpen: () => {
			console.log('Connected to lobby');
			// Request current room and game lists when connected
			ws.send({ type: 'room-list-request' });
			ws.send({ type: 'game-list-request' });
		},
		onClose: () => console.log('Disconnected from lobby')
	});

	// Handle incoming messages
	$effect(() => {
		if (ws.lastMessage?.type === 'room-list') {
			activeRooms = ws.lastMessage.rooms;
		} else if (ws.lastMessage?.type === 'game-list') {
			activeGames = ws.lastMessage.games;
		}
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function joinRoom() {
		if (joinRoomId.trim()) {
			// Check if it's a game ID or poll ID (we'll assume polls for backward compatibility)
			window.location.href = `/poll/${joinRoomId.trim()}`;
		}
	}

	function joinActiveRoom(roomId: string) {
		window.location.href = `/poll/${roomId}`;
	}

	function joinActiveGame(gameId: string) {
		window.location.href = `/game/${gameId}`;
	}

	onMount(() => {
		ws.connect();

		return () => {
			ws.cleanup();
		};
	});
</script>

<svelte:head>
	<title>Lop - Interactive Stories & Polls</title>
</svelte:head>

<main class="container">
	<h1>Lop</h1>
	<p class="subtitle">Create choose-your-own-adventure games or quick polls</p>

	<!-- Tab Navigation -->
	<div class="tabs">
		<button
			class="tab-button {currentTab === 'games' ? 'active' : ''}"
			onclick={() => (currentTab = 'games')}
		>
			🎮 Adventure Games
		</button>
		<button
			class="tab-button {currentTab === 'polls' ? 'active' : ''}"
			onclick={() => (currentTab = 'polls')}
		>
			🗳️ Quick Polls
		</button>
	</div>

	{#if currentTab === 'games'}
		<!-- Create New Game Section -->
		<div class="section">
			<h2>Create Adventure Game</h2>
			<form
				method="POST"
				action="?/createGame"
				use:enhance={() => {
					gameLoading = true;
					return async ({ update }) => {
						gameLoading = false;
						await update();
					};
				}}
			>
				<div class="form-group">
					<label for="storyId">Choose Story:</label>
					<select id="storyId" name="storyId" bind:value={selectedStoryId} required>
						<option value="">Select a story...</option>
						{#each data.stories as story}
							<option value={story.id}>{story.title} ({story.genre}) - {story.estimatedTime}min</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="title">Game Title (optional):</label>
					<input
						id="title"
						name="title"
						type="text"
						placeholder="Custom game title"
						bind:value={gameTitle}
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="maxPlayers">Max Players:</label>
						<input
							id="maxPlayers"
							name="maxPlayers"
							type="number"
							min="1"
							max="50"
							bind:value={maxPlayers}
						/>
					</div>
					<div class="form-group">
						<label>
							<input type="checkbox" name="requiresVoting" bind:checked={requiresVoting} />
							Multiplayer voting
						</label>
					</div>
				</div>

				<button type="submit" class="create-btn" disabled={gameLoading || !selectedStoryId}>
					{gameLoading ? 'Creating Game...' : '🎮 Create Adventure Game'}
				</button>
			</form>

			{#if form?.gameId}
				<div class="poll-created">
					<h3>Game Created! 🎉</h3>
					<div class="room-info">
						<p>Game ID: <strong>{form.gameId}</strong></p>
						<p class="game-title">{form.gameTitle}</p>
						<button class="copy-btn" onclick={() => copyToClipboard(form.gameId)}>
							📋 Copy ID
						</button>
						<a href="/game/{form.gameId}" class="join-btn"> Join Game → </a>
					</div>
					<p class="share-text">Share this game ID with others so they can join the adventure!</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="error">
					{form.error}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Create New Poll Section -->
		<div class="section">
			<h2>Create New Poll</h2>
			<form
				method="POST"
				action="?/createPoll"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<button type="submit" class="create-btn" disabled={loading}>
					{loading ? 'Creating Poll...' : '🎲 Create Random Poll'}
				</button>
			</form>

			{#if form?.pollId}
				<div class="poll-created">
					<h3>Poll Created! 🎉</h3>
					<div class="room-info">
						<p>Room ID: <strong>{form.pollId}</strong></p>
						<button class="copy-btn" onclick={() => copyToClipboard(form.pollId)}>
							📋 Copy ID
						</button>
						<a href="/poll/{form.pollId}" class="join-btn"> Join Poll → </a>
					</div>
					<p class="share-text">Share this room ID with others so they can join and vote!</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="error">
					{form.error}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Join Existing Section -->
	<div class="section">
		<h2>Join Existing {currentTab === 'games' ? 'Game' : 'Poll'}</h2>
		<div class="join-form">
			<input
				type="text"
				placeholder="Enter {currentTab === 'games' ? 'game' : 'room'} ID"
				bind:value={joinRoomId}
				onkeydown={(e) => e.key === 'Enter' && joinRoom()}
			/>
			<button class="join-btn" onclick={joinRoom} disabled={!joinRoomId.trim()}>
				Join {currentTab === 'games' ? 'Game' : 'Poll'}
			</button>
		</div>
	</div>

	<!-- Active Items Section -->
	<div class="section">
		<h2>Browse Active {currentTab === 'games' ? 'Games' : 'Polls'}</h2>

		{#if ws.status === 'connecting'}
			<p class="loading">Connecting to {currentTab === 'games' ? 'game' : 'room'} list...</p>
		{:else if ws.status === 'error'}
			<p class="loading error">Connection error - retrying...</p>
		{:else if currentTab === 'games'}
			{#if activeGames.length === 0}
				<p class="no-rooms">No active games found. Create one above!</p>
			{:else}
				<div class="rooms-list">
					{#each activeGames as game}
						<button class="room-card game-card" onclick={() => joinActiveGame(game.id)}>
							<div class="room-header">
								<h3 class="room-title">{game.title}</h3>
								<span class="room-id">{game.id}</span>
							</div>
							<div class="game-info">
								<span class="story-title">{game.storyTitle}</span>
								<span class="genre-badge {game.genre}">{game.genre}</span>
								<span class="difficulty-badge {game.difficulty}">{game.difficulty}</span>
							</div>
							<div class="room-stats">
								<span class="stat">👥 {game.playerCount}/{game.maxPlayers} players</span>
								<span class="stat">⏱️ {game.estimatedTime}min</span>
								<span class="stat">🎯 {game.currentScene}</span>
							</div>
							<div class="room-time">
								Created {new Date(game.createdAt).toLocaleTimeString()}
								{#if game.isCompleted}
									<span class="completed-badge">✅ Completed</span>
								{:else if !game.isActive}
									<span class="inactive-badge">⏸️ Inactive</span>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{:else if activeRooms.length === 0}
			<p class="no-rooms">No active polls found. Create one above!</p>
		{:else}
			<div class="rooms-list">
				{#each activeRooms as room}
					<button class="room-card" onclick={() => joinActiveRoom(room.id)}>
						<div class="room-header">
							<h3 class="room-title">{room.title}</h3>
							<span class="room-id">{room.id}</span>
						</div>
						<div class="room-stats">
							<span class="stat">👥 {room.activeConnections} active</span>
							<span class="stat">🗳️ {room.totalVotes} votes</span>
						</div>
						<div class="room-time">
							Created {new Date(room.createdAt).toLocaleTimeString()}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</main>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		color: #333;
		margin-bottom: 0.5rem;
		text-align: center;
		font-size: 2.5rem;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin-bottom: 3rem;
		font-size: 1.1rem;
	}

	.section {
		background: #f8fafc;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		border: 1px solid #e2e8f0;
	}

	h2 {
		color: #333;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1.25rem 2rem;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.create-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.create-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.poll-created {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f0fdf4;
		border: 2px solid #16a34a;
		border-radius: 12px;
		text-align: center;
	}

	.poll-created h3 {
		color: #16a34a;
		margin-bottom: 1rem;
	}

	.room-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.room-info p {
		margin: 0;
		font-size: 1.1rem;
	}

	.copy-btn {
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.copy-btn:hover {
		background: #2563eb;
	}

	.join-btn {
		background: #16a34a;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		text-decoration: none;
		transition: background-color 0.2s;
		display: inline-block;
	}

	.join-btn:hover:not(:disabled) {
		background: #15803d;
	}

	.join-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.share-text {
		color: #16a34a;
		font-size: 0.9rem;
		margin: 0;
	}

	.join-form {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.join-form input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.join-form input:focus {
		outline: none;
		border-color: #4f46e5;
	}

	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #fecaca;
		margin-top: 1rem;
	}

	/* Room Browser Styles */
	.loading,
	.no-rooms {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		padding: 2rem;
	}

	.loading.error {
		color: #dc2626;
	}

	.rooms-list {
		display: grid;
		gap: 1rem;
		margin-top: 1rem;
	}

	.room-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		appearance: none;
		width: 100%;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
	}

	.room-card:hover,
	.room-card:focus {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
		transform: translateY(-1px);
		outline: none;
	}

	.room-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 0.75rem;
		gap: 1rem;
	}

	.room-title {
		color: #1f2937;
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		flex: 1;
		line-height: 1.3;
	}

	.room-id {
		background: #f3f4f6;
		color: #6b7280;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-family: monospace;
		white-space: nowrap;
	}

	.room-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.stat {
		color: #6b7280;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.room-time {
		color: #9ca3af;
		font-size: 0.8rem;
	}

	/* Tab navigation styles */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		background: #f1f5f9;
		border-radius: 12px;
		padding: 0.5rem;
	}

	.tab-button {
		flex: 1;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
		color: #64748b;
	}

	.tab-button.active {
		background: white;
		color: #1f2937;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tab-button:hover:not(.active) {
		background: #e2e8f0;
	}

	/* Form styles */
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #374151;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #4f46e5;
	}

	.form-row {
		display: flex;
		gap: 1rem;
		align-items: end;
	}

	.form-row .form-group {
		flex: 1;
	}

	.form-group input[type='checkbox'] {
		width: auto;
		margin-right: 0.5rem;
	}

	.form-group label input[type='checkbox'] {
		margin-right: 0.5rem;
	}

	.game-title {
		font-size: 0.9rem;
		color: #6b7280;
		margin: 0;
	}

	/* Game card styles */
	.game-card {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border: 2px solid #e2e8f0;
	}

	.game-card:hover,
	.game-card:focus {
		border-color: #6366f1;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
	}

	.game-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.story-title {
		font-size: 0.9rem;
		color: #4b5563;
		font-weight: 500;
	}

	.genre-badge,
	.difficulty-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.genre-badge.fantasy {
		background: #fef3c7;
		color: #92400e;
	}
	.genre-badge.sci-fi {
		background: #dbeafe;
		color: #1e40af;
	}
	.genre-badge.horror {
		background: #fee2e2;
		color: #991b1b;
	}
	.genre-badge.mystery {
		background: #f3e8ff;
		color: #7c3aed;
	}
	.genre-badge.comedy {
		background: #dcfce7;
		color: #166534;
	}

	.difficulty-badge.easy {
		background: #dcfce7;
		color: #166534;
	}
	.difficulty-badge.medium {
		background: #fef3c7;
		color: #92400e;
	}
	.difficulty-badge.hard {
		background: #fee2e2;
		color: #991b1b;
	}

	.completed-badge,
	.inactive-badge {
		margin-left: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.completed-badge {
		background: #dcfce7;
		color: #166534;
	}

	.inactive-badge {
		background: #f3f4f6;
		color: #6b7280;
	}
</style>
