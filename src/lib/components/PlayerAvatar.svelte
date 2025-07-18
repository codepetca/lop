<script lang="ts">
	import { buildAvatarUrl, type AvatarConfig } from '$lib/avatar/utils';

	let {
		avatar,
		size = 64,
		clickable = false,
		onclick
	}: {
		avatar: AvatarConfig;
		size?: number;
		clickable?: boolean;
		onclick?: () => void;
	} = $props();

	const avatarUrl = $derived(buildAvatarUrl(avatar, size));
</script>

<button
	class="avatar-container"
	class:clickable
	style="width: {size}px; height: {size}px;"
	{onclick}
	disabled={!clickable}
>
	<img src={avatarUrl} alt="Player avatar" class="avatar-image" loading="lazy" />
</button>

<style>
	.avatar-container {
		border: none;
		background: none;
		padding: 0;
		border-radius: 50%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		position: relative;
		background: #f8fafc;
	}

	.avatar-container.clickable {
		cursor: pointer;
	}

	.avatar-container.clickable:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.avatar-container.clickable:active {
		transform: scale(0.98);
	}

	.avatar-container:disabled {
		cursor: default;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		display: block;
	}

	/* Loading state placeholder */
	.avatar-container::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.avatar-container:has(.avatar-image:not([src])):before,
	.avatar-container:has(.avatar-image[src='']):before {
		opacity: 1;
	}
</style>
