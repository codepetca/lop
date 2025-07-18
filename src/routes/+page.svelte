<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { ActionData, PageData } from './$types';
	import type {
		RoomMetadata,
		GameMetadata,
		Message,
		RoomListRequestMessage,
		GameListRequestMessage
	} from '$lib/types';
	import { useWebSocket } from '$lib/hooks/useWebSocket.svelte';
	import { store } from '$lib/stores';
	import TitleHeader from '$lib/components/TitleHeader.svelte';
	import PlayerProfileModal from '$lib/components/PlayerProfileModal.svelte';
	import AdvancedOptionsModal from '$lib/components/AdvancedOptionsModal.svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let loading = $state(false);
	let activeGames = $state<GameMetadata[]>([]);
	let showProfileModal = $state(false);
	let showAdvancedModal = $state(false);

	// Initialize WebSocket hook for lobby (lobby is main server now)
	const ws = useWebSocket<Message, RoomListRequestMessage | GameListRequestMessage>(
		'main',
		'main',
		{
			onOpen: () => {
				console.log('Connected to lobby');
				// Request current game list when connected
				ws.send({ type: 'game-list-request' });
			},
			onClose: () => console.log('Disconnected from lobby')
		}
	);

	// Handle incoming messages
	$effect(() => {
		if (ws.lastMessage?.type === 'game-list') {
			activeGames = ws.lastMessage.games;
		}
	});

	function joinActiveGame(gameId: string) {
		window.location.href = `/game/${gameId}`;
	}

	function openProfileModal() {
		showProfileModal = true;
	}

	function openAdvancedModal() {
		showAdvancedModal = true;
	}

	function createQuickGame() {
		// Create a random game with default settings
		const randomStoryIndex = Math.floor(Math.random() * data.stories.length);
		const randomStory = data.stories[randomStoryIndex];
		
		// Create form data and submit
		const formData = new FormData();
		formData.append('storyId', randomStory.id);
		formData.append('maxPlayers', '6');
		
		loading = true;
		fetch('?/createGame', {
			method: 'POST',
			body: formData
		}).then(response => response.text()).then(() => {
			loading = false;
			// Refresh the page to show the result
			window.location.reload();
		}).catch(() => {
			loading = false;
		});
	}

	onMount(() => {
		// Initialize player if not exists
		store.initializePlayer();

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
	<!-- Title Header with Player Info -->
	<TitleHeader player={store.player} onPlayerClick={openProfileModal} />

	<!-- Player Profile Modal -->
	<PlayerProfileModal bind:isOpen={showProfileModal} />

	<!-- Advanced Options Modal -->
	<AdvancedOptionsModal bind:isOpen={showAdvancedModal} {data} {form} />

	<!-- Quick Actions -->
	<div class="quick-actions">
		<button class="quick-create-btn" onclick={createQuickGame} disabled={loading}>
			{loading ? 'Creating Game...' : '🎮 Create Quick Game'}
		</button>
		<button class="advanced-btn" onclick={openAdvancedModal}>
			⚙️ Advanced Options
		</button>
	</div>

	<!-- Active Items Section -->
	<div class="section">
		<h2>Browse Active Games</h2>

		{#if ws.status === 'connecting'}
			<p class="loading">Connecting to game list...</p>
		{:else if ws.status === 'error'}
			<p class="loading error">Connection error - retrying...</p>
		{:else if activeGames.length === 0}
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
	</div>
</main>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.quick-actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.quick-create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		flex: 1;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.quick-create-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.quick-create-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.advanced-btn {
		background: #f8fafc;
		color: #374151;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.advanced-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
		background: #eff6ff;
	}

	@media (max-width: 600px) {
		.quick-actions {
			flex-direction: column;
		}

		.advanced-btn {
			white-space: normal;
		}
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
