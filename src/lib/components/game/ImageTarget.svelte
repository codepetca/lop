<script lang="ts">
	import type { StoryChoice } from '$lib/types';

	let {
		choice,
		votes = 0,
		hasVoted = false,
		disabled = false,
		onclick
	}: {
		choice: StoryChoice;
		votes?: number;
		hasVoted?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	} = $props();

	// Default position and size if not specified
	const position = choice.position || { x: 50, y: 50 };
	const size = choice.size || { width: 20, height: 15 };
</script>

<button
	class="image-target"
	class:has-voted={hasVoted}
	class:disabled
	style:left="{position.x}%"
	style:top="{position.y}%"
	style:width="{size.width}%"
	style:height="{size.height}%"
	{disabled}
	{onclick}
	aria-label={choice.text}
	title={choice.text}
>
	{#if choice.imageUrl}
		<img src={choice.imageUrl} alt={choice.text} class="choice-image" />
	{:else}
		<!-- Fallback visual for targets without images -->
		<div class="fallback-target">
			<span class="choice-label">{choice.text}</span>
		</div>
	{/if}

	<!-- Vote count indicator -->
	{#if votes > 0}
		<div class="vote-indicator">
			<span class="vote-count">{votes}</span>
		</div>
	{/if}

	<!-- Selection indicator for voted state -->
	{#if hasVoted}
		<div class="selection-indicator">
			<div class="checkmark">✓</div>
		</div>
	{/if}
</button>

<style>
	.image-target {
		position: absolute;
		border: 2px solid transparent;
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 0;
		overflow: hidden;
		transform: translate(-50%, -50%);
	}

	.image-target:hover:not(.disabled) {
		border-color: #6366f1;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
		transform: translate(-50%, -50%) scale(1.05);
	}

	.image-target:active:not(.disabled) {
		transform: translate(-50%, -50%) scale(0.98);
	}

	.image-target.has-voted {
		border-color: #10b981;
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.image-target.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.choice-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 6px;
	}

	.fallback-target {
		width: 100%;
		height: 100%;
		background: rgba(99, 102, 241, 0.8);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		text-align: center;
		padding: 0.5rem;
	}

	.choice-label {
		font-size: 0.9rem;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.vote-indicator {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #ef4444;
		color: white;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.selection-indicator {
		position: absolute;
		top: -6px;
		left: -6px;
		background: #10b981;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.checkmark {
		font-size: 0.75rem;
		font-weight: bold;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.choice-label {
			font-size: 0.8rem;
		}

		.vote-indicator,
		.selection-indicator {
			width: 20px;
			height: 20px;
			font-size: 0.7rem;
		}
	}
</style>