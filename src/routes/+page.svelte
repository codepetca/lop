<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fade, slide } from 'svelte/transition';
	import type { ActionData, PageData } from './$types';
	import type {
		RoomMetadata,
		GameMetadata,
		Message,
		RoomListRequestMessage,
		GameListRequestMessage
	} from '$lib/types';
	import {
		useWebSocket,
		store,
		PlayerProfileModal,
		TitleHeader,
		AdvancedOptionsModal,
		GameCardSkeleton
	} from '$lib';

	let { form, data }: { form: ActionData; data: PageData } = $props();

	let loading = $state(false);
	let activeGames = $state<GameMetadata[]>([]);
	let showProfileModal = $state(false);
	let showAdvancedModal = $state(false);

	// Check for reduced motion preference
	let prefersReducedMotion = $state(false);

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

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
		// Ensure player is initialized
		if (!store.player) {
			store.initializePlayer();
		}

		// Player should exist after initialization
		if (!store.player) {
			console.error('Failed to initialize player');
			return;
		}

		// Create a random game with default settings
		const randomStoryIndex = Math.floor(Math.random() * data.stories.length);
		const randomStory = data.stories[randomStoryIndex];

		// Transform player data to match BasePlayerSchema
		const creatorData = {
			id: store.player.id,
			name: store.player.name,
			joinedAt: new Date().toISOString(),
			avatar: store.player.avatar
		};

		// Create form data and submit
		const formData = new FormData();
		formData.append('storyId', randomStory.id);
		formData.append('maxPlayers', '6');
		formData.append('creator', JSON.stringify(creatorData));

		loading = true;
		fetch('?/createGame', {
			method: 'POST',
			body: formData
		})
			.then((response) => response.text())
			.then(() => {
				loading = false;
				// Refresh the page to show the result
				window.location.reload();
			})
			.catch(() => {
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
			{loading ? 'Creating Game...' : '🎮 Host Game'}
		</button>
		<button class="advanced-btn" onclick={openAdvancedModal}> ⚙️ Advanced </button>
	</div>

	<!-- Active Items Section -->
	{#if ws.status === 'connecting' || ws.status === 'error' || activeGames.length > 0}
		<div
			class="section"
			in:fade={{ duration: prefersReducedMotion ? 0 : 300 }}
			out:fade={{ duration: prefersReducedMotion ? 0 : 200 }}
		>
			{#if ws.status === 'connecting'}
				<div class="rooms-list">
					{#each [1, 2, 3] as skeletonId (skeletonId)}
						<GameCardSkeleton />
					{/each}
				</div>
			{:else if ws.status === 'error'}
				<p class="loading error" in:fade={{ duration: prefersReducedMotion ? 0 : 200 }}>
					Connection error - retrying...
				</p>
			{:else if activeGames.length === 0}
				<p class="no-rooms" in:fade={{ duration: prefersReducedMotion ? 0 : 200 }}>
					No active games found. Create one below!
				</p>
			{:else}
				<div class="rooms-list">
					{#each activeGames as game (game.id)}
						<div
							in:slide={{
								duration: prefersReducedMotion ? 0 : 300,
								delay: prefersReducedMotion ? 0 : activeGames.indexOf(game) * 50
							}}
							out:slide={{ duration: prefersReducedMotion ? 0 : 200 }}
						>
							<button class="room-card game-card" onclick={() => joinActiveGame(game.id)}>
								<div class="game-card-content">
									<div class="creator-avatar">
										<img
											src="https://api.dicebear.com/9.x/{game.creator.avatar.style}/svg?seed={game
												.creator.avatar.seed}{game.creator.avatar.backgroundColor
												? `&backgroundColor=${game.creator.avatar.backgroundColor}`
												: ''}"
											alt="{game.creator.name}'s avatar"
											title="Created by {game.creator.name}"
										/>
									</div>
									<div class="game-main">
										<h3 class="game-title">{game.title}</h3>
										<p class="game-story">{game.storyTitle}</p>
										<div class="game-meta">
											<span class="players-count">{game.playerCount}/{game.maxPlayers} players</span
											>
											<span class="game-status">{game.currentScene}</span>
										</div>
									</div>
									<div class="game-badges">
										<span class="genre-badge {game.genre}">{game.genre}</span>
										<span class="difficulty-badge {game.difficulty}">{game.difficulty}</span>
									</div>
								</div>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
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
		padding: 0;
		margin-bottom: 2rem;
		border: 1px solid #e2e8f0;
	}

	/* Room Browser Styles */
	.loading,
	.no-rooms {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		padding: 1.5rem;
		background: transparent;
		margin: 0;
	}

	.loading.error {
		color: #dc2626;
	}

	.rooms-list {
		display: grid;
		gap: 0;
		margin-top: 0;
	}

	.room-card {
		background: white;
		border: none;
		border-bottom: 1px solid #e5e7eb;
		border-radius: 0;
		padding: 1rem 1.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: none;
		appearance: none;
		width: 100%;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
	}

	.room-card:last-child {
		border-bottom: none;
	}

	.room-card:first-child {
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	.room-card:last-child {
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	.room-card:hover,
	.room-card:focus {
		background: #f0f9ff;
		box-shadow: none;
		transform: none;
		outline: none;
	}

	.game-card-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.creator-avatar {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
	}

	.creator-avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 2px solid #e5e7eb;
		background: white;
	}

	.game-main {
		flex: 1;
		min-width: 0;
	}

	.game-title {
		color: #1f2937;
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.game-story {
		color: #6b7280;
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		line-height: 1.3;
	}

	.game-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: 0.85rem;
		color: #9ca3af;
	}

	.players-count {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.game-status {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.game-badges {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	/* Game card styles */
	.game-card {
		background: white;
	}

	.game-card:hover,
	.game-card:focus {
		background: #f0f9ff;
	}

	.genre-badge,
	.difficulty-badge {
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
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

	@media (max-width: 480px) {
		.game-card-content {
			flex-direction: row;
			align-items: center;
		}

		.creator-avatar {
			width: 40px;
			height: 40px;
		}

		.game-badges {
			flex-direction: column;
			align-self: center;
		}

		.game-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
