<script lang="ts">
	import { PlayerAvatar } from '$lib';
	import type { Player } from '$lib/types';

	let {
		player,
		onPlayerClick
	}: {
		player: Player | null;
		onPlayerClick?: () => void;
	} = $props();
</script>

<header class="title-header">
	<h1 class="app-title">Lop</h1>

	{#if player}
		<div class="player-info">
			<PlayerAvatar avatar={player.avatar} size={64} clickable={true} onclick={onPlayerClick} />
		</div>
	{/if}
</header>

<style>
	.title-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f0f7ff;
		border: 2px solid #3b82f6;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.app-title {
		color: #333;
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.player-info {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.title-header {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.app-title {
			font-size: 2rem;
		}
	}

	@media (max-width: 480px) {
		.title-header {
			padding: 1rem;
		}

		.app-title {
			font-size: 1.8rem;
		}
	}
</style>
