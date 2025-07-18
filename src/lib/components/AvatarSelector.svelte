<script lang="ts">
	import {
		AVATAR_STYLES,
		getStylePreviewUrl,
		generateNewRandomAvatar,
		type AvatarConfig,
		type AvatarStyle
	} from '$lib/avatar/utils';
	import PlayerAvatar from './PlayerAvatar.svelte';

	let {
		currentAvatar,
		onSelect
	}: {
		currentAvatar: AvatarConfig;
		onSelect: (avatar: AvatarConfig) => void;
	} = $props();

	let selectedStyle = $state<AvatarStyle>(currentAvatar.style as AvatarStyle);
	let previewAvatar = $state<AvatarConfig>(currentAvatar);

	// Update preview when style changes
	$effect(() => {
		if (selectedStyle !== currentAvatar.style) {
			previewAvatar = {
				...currentAvatar,
				style: selectedStyle
			};
		} else {
			previewAvatar = currentAvatar;
		}
	});

	function handleStyleSelect(style: AvatarStyle) {
		selectedStyle = style;
	}

	function handleRandomize() {
		const newAvatar = generateNewRandomAvatar();
		selectedStyle = newAvatar.style as AvatarStyle;
		previewAvatar = newAvatar;
	}

	function handleApply() {
		onSelect(previewAvatar);
	}

	function handleReset() {
		selectedStyle = currentAvatar.style as AvatarStyle;
		previewAvatar = currentAvatar;
	}
</script>

<div class="avatar-selector">
	<div class="preview-section">
		<h3>Preview</h3>
		<div class="preview-container">
			<PlayerAvatar avatar={previewAvatar} size={96} />
		</div>
		<div class="preview-actions">
			<button class="randomize-btn" onclick={handleRandomize}> 🎲 Randomize </button>
		</div>
	</div>

	<div class="styles-section">
		<h3>Avatar Styles</h3>
		<div class="styles-grid">
			{#each AVATAR_STYLES as style}
				<button
					class="style-option"
					class:selected={selectedStyle === style}
					onclick={() => handleStyleSelect(style)}
				>
					<img
						src={getStylePreviewUrl(style, 48)}
						alt={style}
						class="style-preview"
						loading="lazy"
					/>
					<span class="style-name">{style.replace(/-/g, ' ')}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="actions">
		<button class="reset-btn" onclick={handleReset}> Reset </button>
		<button class="apply-btn" onclick={handleApply}> Apply Changes </button>
	</div>
</div>

<style>
	.avatar-selector {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-height: 500px;
		overflow: hidden;
	}

	.preview-section {
		text-align: center;
	}

	.preview-section h3 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1.1rem;
	}

	.preview-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.preview-actions {
		display: flex;
		justify-content: center;
	}

	.randomize-btn {
		background: #f59e0b;
		color: #78350f;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.randomize-btn:hover {
		background: #d97706;
	}

	.styles-section {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.styles-section h3 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1.1rem;
	}

	.styles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
		overflow-y: auto;
		max-height: 300px;
		padding-right: 0.5rem;
	}

	.styles-grid::-webkit-scrollbar {
		width: 8px;
	}

	.styles-grid::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 4px;
	}

	.styles-grid::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 4px;
	}

	.styles-grid::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	.style-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.8rem;
		text-align: center;
	}

	.style-option:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
	}

	.style-option.selected {
		border-color: #3b82f6;
		background: #eff6ff;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.style-preview {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		background: #f8fafc;
	}

	.style-name {
		color: #6b7280;
		font-weight: 500;
		text-transform: capitalize;
		line-height: 1.2;
		word-break: break-word;
	}

	.style-option.selected .style-name {
		color: #3b82f6;
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.reset-btn,
	.apply-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.reset-btn {
		background: #f3f4f6;
		color: #6b7280;
	}

	.reset-btn:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.apply-btn {
		background: #3b82f6;
		color: white;
	}

	.apply-btn:hover {
		background: #2563eb;
	}
</style>
