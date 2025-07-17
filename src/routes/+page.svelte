<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ActionData } from './$types';
	import type { RoomMetadata, Message, RoomListRequestMessage } from '$lib/types';
	import { useWebSocket } from '$lib/hooks/useWebSocket.svelte';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let joinRoomId = $state('');
	let activeRooms = $state<RoomMetadata[]>([]);

	// Initialize WebSocket hook for lobby (lobby is main server now)
	const ws = useWebSocket<Message, RoomListRequestMessage>('main', 'main', {
		onOpen: () => {
			console.log('Connected to lobby');
			// Request current room list when connected
			ws.send({ type: 'room-list-request' });
		},
		onClose: () => console.log('Disconnected from lobby')
	});

	// Handle incoming messages
	$effect(() => {
		if (ws.lastMessage?.type === 'room-list') {
			activeRooms = ws.lastMessage.rooms;
		}
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function joinRoom() {
		if (joinRoomId.trim()) {
			window.location.href = `/${joinRoomId.trim()}`;
		}
	}

	function joinActiveRoom(roomId: string) {
		window.location.href = `/${roomId}`;
	}

	onMount(() => {
		ws.connect();

		return () => {
			ws.cleanup();
		};
	});
</script>

<svelte:head>
	<title>Create a Poll</title>
</svelte:head>

<main class="container">
	<h1>Lop</h1>
	<p class="subtitle">Create instant polls with random questions</p>

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
					<a href="/{form.pollId}" class="join-btn"> Join Poll → </a>
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

	<!-- Join Existing Poll Section -->
	<div class="section">
		<h2>Join Existing Poll</h2>
		<div class="join-form">
			<input
				type="text"
				placeholder="Enter room ID"
				bind:value={joinRoomId}
				onkeydown={(e) => e.key === 'Enter' && joinRoom()}
			/>
			<button class="join-btn" onclick={joinRoom} disabled={!joinRoomId.trim()}> Join Poll </button>
		</div>
	</div>

	<!-- Active Rooms Section -->
	<div class="section">
		<h2>Browse Active Polls</h2>

		{#if ws.status === 'connecting'}
			<p class="loading">Connecting to room list...</p>
		{:else if ws.status === 'error'}
			<p class="loading error">Connection error - retrying...</p>
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
</style>
