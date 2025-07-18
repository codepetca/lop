<script lang="ts">
	import PlayerAvatar from './PlayerAvatar.svelte';
	import type { GamePlayer } from '$shared/schemas';

	let {
		player,
		isCurrentPlayer = false,
		hasVoted = false,
		size = 32,
		showName = true,
		onclick
	}: {
		player: GamePlayer;
		isCurrentPlayer?: boolean;
		hasVoted?: boolean;
		size?: number;
		showName?: boolean;
		onclick?: (player: GamePlayer) => void;
	} = $props();

	function handleClick() {
		if (onclick) {
			onclick(player);
		}
	}

	function handleEmote(emote: string) {
		// TODO: Implement emote system
		console.log(`${player.name} ${emote}`);
	}
</script>

<div class="game-avatar" class:current-player={isCurrentPlayer}>
	<div class="avatar-wrapper">
		<PlayerAvatar avatar={player.avatar} {size} clickable={true} onclick={handleClick} />
		{#if isCurrentPlayer}
			<div class="current-indicator">👤</div>
		{/if}
		{#if hasVoted}
			<div class="vote-indicator">✓</div>
		{/if}
	</div>

	{#if showName}
		<span class="player-name" class:current={isCurrentPlayer}>
			{player.name}
		</span>
	{/if}

	<!-- Future: Emote panel -->
	<!-- 
	<div class="emote-panel">
		<button onclick={() => handleEmote('waves')}>👋</button>
		<button onclick={() => handleEmote('thumbs up')}>👍</button>
		<button onclick={() => handleEmote('thinking')}>🤔</button>
	</div>
	-->
</div>

<style>
	.game-avatar {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		transition: transform 0.2s ease;
		min-width: 48px;
	}

	.game-avatar:hover {
		transform: translateY(-2px);
	}

	.avatar-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.current-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		background: #10b981;
		color: white;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.vote-indicator {
		position: absolute;
		top: -2px;
		right: -2px;
		background: #059669;
		color: white;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		font-size: 12px;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
		z-index: 2;
	}

	.player-name {
		font-size: 0.7rem;
		color: #6b7280;
		font-weight: 500;
		text-align: center;
		max-width: 48px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.player-name.current {
		color: #10b981;
		font-weight: 600;
	}

	.game-avatar.current-player .avatar-wrapper {
		border: 2px solid #10b981;
		border-radius: 50%;
		padding: 2px;
	}

	/* Future emote panel styles */
	/*
	.emote-panel {
		position: absolute;
		top: -40px;
		left: 50%;
		transform: translateX(-50%);
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 0.25rem;
		display: none;
		gap: 0.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.game-avatar:hover .emote-panel {
		display: flex;
	}

	.emote-panel button {
		background: none;
		border: none;
		padding: 0.25rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background-color 0.2s;
	}

	.emote-panel button:hover {
		background: #f3f4f6;
	}
	*/
</style>
