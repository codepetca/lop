<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from '../../routes/$types';
	import { store } from '$lib/stores';

	let {
		isOpen = $bindable(),
		onClose,
		data,
		form
	}: {
		isOpen: boolean;
		onClose?: () => void;
		data: PageData;
		form: ActionData;
	} = $props();

	let gameLoading = $state(false);
	let selectedStoryId = $state('');
	let maxPlayers = $state(6);
	let joinRoomId = $state('');

	// Reset state when modal opens
	$effect(() => {
		if (isOpen) {
			selectedStoryId = '';
			maxPlayers = 6;
			joinRoomId = '';
		}
	});

	function handleClose() {
		isOpen = false;
		onClose?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function joinRoom() {
		if (joinRoomId.trim()) {
			window.location.href = `/game/${joinRoomId.trim()}`;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		} else if (event.key === 'Enter' && joinRoomId.trim()) {
			joinRoom();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Modal backdrop -->
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="advanced-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="advanced-title">Advanced Game Options</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close modal"> ✕ </button>
			</div>

			<!-- Content -->
			<div class="modal-body">
				<!-- Create Game Section -->
				<div class="section">
					<h3>Create Custom Game</h3>
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
									<option value={story.id}
										>{story.title} ({story.genre}) - {story.estimatedTime}min</option
									>
								{/each}
							</select>
						</div>

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

						<!-- Hidden field for creator data -->
						<input
							type="hidden"
							name="creator"
							value={JSON.stringify({
								id: store.player?.id,
								name: store.player?.name,
								joinedAt: new Date().toISOString(),
								avatar: store.player?.avatar
							})}
						/>

						<button type="submit" class="create-btn" disabled={gameLoading || !selectedStoryId}>
							{gameLoading ? 'Creating Game...' : '🎮 Create Custom Game'}
						</button>
					</form>

					{#if form?.gameId}
						<div class="result-created">
							<h4>Game Created! 🎉</h4>
							<div class="result-info">
								<p>Game ID: <strong>{form.gameId}</strong></p>
								<p class="game-title">{form.gameTitle}</p>
								<div class="result-actions">
									<button class="copy-btn" onclick={() => copyToClipboard(form.gameId)}>
										📋 Copy ID
									</button>
									<a href="/game/{form.gameId}" class="join-btn"> Join Game → </a>
								</div>
							</div>
							<p class="share-text">
								Share this game ID with others so they can join the adventure!
							</p>
						</div>
					{/if}

					{#if form?.error}
						<div class="error">
							{form.error}
						</div>
					{/if}
				</div>

				<!-- Join Game Section -->
				<div class="section">
					<h3>Join Existing Game</h3>
					<div class="join-form">
						<input
							type="text"
							placeholder="Enter game ID"
							bind:value={joinRoomId}
							onkeydown={(e) => e.key === 'Enter' && joinRoom()}
						/>
						<button class="join-btn" onclick={joinRoom} disabled={!joinRoomId.trim()}>
							Join Game
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: #1f2937;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #374151;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		background: #f8fafc;
	}

	.section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.2rem;
		color: #374151;
	}

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

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.create-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.create-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.result-created {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f0fdf4;
		border: 2px solid #16a34a;
		border-radius: 12px;
		text-align: center;
	}

	.result-created h4 {
		color: #16a34a;
		margin: 0 0 1rem 0;
	}

	.result-info {
		margin-bottom: 1rem;
	}

	.result-info p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

	.game-title {
		font-size: 0.9rem;
		color: #6b7280;
		margin: 0;
	}

	.result-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
		flex-wrap: wrap;
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

	@media (max-width: 600px) {
		.modal-content {
			margin: 0.5rem;
			max-height: 95vh;
		}

		.result-actions {
			flex-direction: column;
			align-items: center;
		}

		.join-form {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
