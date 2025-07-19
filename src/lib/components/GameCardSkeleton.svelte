<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<div class="skeleton-container" in:fade={{ duration: 200 }}>
	<div class="room-card skeleton-card">
		<div class="game-card-content">
			<div class="creator-avatar skeleton-avatar">
				<div class="skeleton-circle"></div>
			</div>
			<div class="game-main">
				<div class="skeleton-title"></div>
				<div class="skeleton-story"></div>
				<div class="skeleton-meta">
					<div class="skeleton-meta-item"></div>
					<div class="skeleton-meta-item"></div>
				</div>
			</div>
			<div class="game-badges">
				<div class="skeleton-badge"></div>
				<div class="skeleton-badge"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.skeleton-container {
		width: 100%;
	}

	.skeleton-card {
		background: white;
		border: none;
		border-bottom: 1px solid #e5e7eb;
		border-radius: 0;
		padding: 1rem 1.25rem;
		cursor: default;
		width: 100%;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
		pointer-events: none;
	}

	.skeleton-card:first-child {
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	.skeleton-card:last-child {
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
		border-bottom: none;
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

	.skeleton-circle {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.game-main {
		flex: 1;
		min-width: 0;
	}

	.skeleton-title {
		height: 1.3rem;
		background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		width: 60%;
	}

	.skeleton-story {
		height: 1rem;
		background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		width: 80%;
	}

	.skeleton-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.skeleton-meta-item {
		height: 0.9rem;
		background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
		width: 4rem;
	}

	.game-badges {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.skeleton-badge {
		height: 1.2rem;
		width: 3rem;
		background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
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

		.skeleton-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
