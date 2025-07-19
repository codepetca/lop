<script lang="ts">
	import { store, PlayerAvatar, AvatarSelector, type AvatarConfig } from '$lib';

	let {
		isOpen = $bindable(),
		onClose
	}: {
		isOpen: boolean;
		onClose?: () => void;
	} = $props();

	let editingName = $state(false);
	let tempName = $state('');
	let showAvatarSelector = $state(false);

	// Reset state when modal opens
	$effect(() => {
		if (isOpen) {
			editingName = false;
			tempName = '';
			showAvatarSelector = false;
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

	function startEditingName() {
		tempName = store.player?.name || '';
		editingName = true;
	}

	function saveName() {
		if (tempName.trim()) {
			store.updatePlayerName(tempName.trim());
			editingName = false;
		}
	}

	function cancelNameEdit() {
		editingName = false;
		tempName = '';
	}

	function generateNewName() {
		store.generateNewName();
		editingName = false;
	}

	function handleAvatarSelect(avatar: AvatarConfig) {
		store.updatePlayerAvatar(avatar);
		showAvatarSelector = false;
	}

	function generateNewAvatar() {
		store.generateNewAvatar();
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (showAvatarSelector) {
				showAvatarSelector = false;
			} else if (editingName) {
				cancelNameEdit();
			} else {
				handleClose();
			}
		} else if (event.key === 'Enter' && editingName) {
			saveName();
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
		aria-labelledby="profile-title"
		tabindex="-1"
	>
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="profile-title">Player Profile</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close modal"> ✕ </button>
			</div>

			<!-- Content -->
			<div class="modal-body">
				{#if showAvatarSelector && store.player}
					<!-- Avatar Selector View -->
					<div class="avatar-selector-container">
						<div class="section-header">
							<button class="back-btn" onclick={() => (showAvatarSelector = false)}>
								← Back to Profile
							</button>
						</div>
						<AvatarSelector currentAvatar={store.player.avatar} onSelect={handleAvatarSelect} />
					</div>
				{:else if store.player}
					<!-- Main Profile View -->
					<div class="profile-content">
						<!-- Avatar Section -->
						<div class="avatar-section">
							<PlayerAvatar
								avatar={store.player.avatar}
								size={120}
								clickable={true}
								onclick={() => (showAvatarSelector = true)}
							/>
							<div class="avatar-actions">
								<button class="avatar-btn" onclick={() => (showAvatarSelector = true)}>
									🎨 Customize Avatar
								</button>
								<button class="avatar-btn" onclick={generateNewAvatar}> 🎲 Random Avatar </button>
							</div>
						</div>

						<!-- Name Section -->
						<div class="name-section">
							<label class="section-label" for="player-name-input">Player Name</label>
							{#if editingName}
								<div class="name-edit">
									<input
										id="player-name-input"
										type="text"
										bind:value={tempName}
										placeholder="Enter name"
										maxlength="20"
										class="name-input"
									/>
									<div class="name-actions">
										<button class="save-btn" onclick={saveName}>✓ Save</button>
										<button class="cancel-btn" onclick={cancelNameEdit}>✕ Cancel</button>
									</div>
								</div>
							{:else}
								<div class="name-display">
									<span class="player-name" class:generated={store.player.isGenerated}>
										{store.player.name}
									</span>
									<div class="name-actions">
										<button class="edit-btn" onclick={startEditingName}>✏️ Edit</button>
										<button class="generate-btn" onclick={generateNewName}> 🎲 New Name </button>
									</div>
								</div>
							{/if}
						</div>

						<!-- Player Info -->
						<div class="info-section">
							<div class="info-item">
								<span class="info-label">Player ID:</span>
								<span class="info-value">{store.player.id.slice(0, 8)}...</span>
							</div>
							<div class="info-item">
								<span class="info-label">Created:</span>
								<span class="info-value">
									{new Date(store.player.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>
				{/if}
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
		max-width: 500px;
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
	}

	.avatar-selector-container {
		height: 100%;
	}

	.section-header {
		margin-bottom: 1rem;
	}

	.back-btn {
		background: none;
		border: none;
		color: #3b82f6;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.back-btn:hover {
		background: #eff6ff;
	}

	.profile-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.avatar-section {
		text-align: center;
	}

	.avatar-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.avatar-btn {
		padding: 0.5rem 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		color: #374151;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.avatar-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.name-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-label {
		font-weight: 600;
		color: #374151;
		font-size: 0.9rem;
	}

	.name-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.player-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		flex: 1;
	}

	.player-name.generated {
		font-style: italic;
		color: #6366f1;
	}

	.name-edit {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.name-input {
		padding: 0.75rem;
		border: 2px solid #3b82f6;
		border-radius: 8px;
		font-size: 1rem;
		outline: none;
	}

	.name-actions {
		display: flex;
		gap: 0.5rem;
	}

	.edit-btn,
	.generate-btn,
	.save-btn,
	.cancel-btn {
		padding: 0.5rem 0.75rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.edit-btn {
		background: #e0e7ff;
		color: #4c1d95;
	}

	.edit-btn:hover {
		background: #c7d2fe;
	}

	.generate-btn {
		background: #fbbf24;
		color: #78350f;
	}

	.generate-btn:hover {
		background: #f59e0b;
	}

	.save-btn {
		background: #10b981;
		color: white;
		flex: 1;
	}

	.save-btn:hover {
		background: #059669;
	}

	.cancel-btn {
		background: #ef4444;
		color: white;
		flex: 1;
	}

	.cancel-btn:hover {
		background: #dc2626;
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.info-value {
		color: #1f2937;
		font-size: 0.9rem;
		font-family: monospace;
	}

	@media (max-width: 600px) {
		.modal-content {
			margin: 0.5rem;
			max-height: 95vh;
		}

		.avatar-actions {
			flex-direction: column;
			align-items: center;
		}

		.name-display {
			flex-direction: column;
			align-items: stretch;
		}

		.name-actions {
			justify-content: center;
		}
	}
</style>
