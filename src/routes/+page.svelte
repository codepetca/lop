<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
	let joinRoomId = '';

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function joinRoom() {
		if (joinRoomId.trim()) {
			window.location.href = `/${joinRoomId.trim()}`;
		}
	}
</script>

<svelte:head>
	<title>Create a Poll</title>
</svelte:head>

<main class="container">
	<h1>EasyPoll</h1>
	<p class="subtitle">Create instant polls with random questions</p>

	<!-- Create New Poll Section -->
	<div class="section">
		<h2>Create New Poll</h2>
		<form
			method="POST"
			action="?/createPoll"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<button type="submit" class="create-btn" disabled={loading}>
				{loading ? 'Creating Poll...' : '🎲 Create Random Poll'}
			</button>
		</form>

		{#if form?.pollId}
			<div class="poll-created">
				<h3>Poll Created! 🎉</h3>
				<div class="room-info">
					<p>Room ID: <strong>{form.pollId}</strong></p>
					<button class="copy-btn" on:click={() => copyToClipboard(form.pollId)}>
						📋 Copy ID
					</button>
					<a href="/{form.pollId}" class="join-btn"> Join Poll → </a>
				</div>
				<p class="share-text">Share this room ID with others so they can join and vote!</p>
			</div>
		{/if}

		{#if form?.error}
			<div class="error">
				{form.error}
			</div>
		{/if}
	</div>

	<!-- Join Existing Poll Section -->
	<div class="section">
		<h2>Join Existing Poll</h2>
		<div class="join-form">
			<input
				type="text"
				placeholder="Enter room ID"
				bind:value={joinRoomId}
				on:keydown={(e) => e.key === 'Enter' && joinRoom()}
			/>
			<button class="join-btn" on:click={joinRoom} disabled={!joinRoomId.trim()}>
				Join Poll
			</button>
		</div>
	</div>
</main>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		color: #333;
		margin-bottom: 0.5rem;
		text-align: center;
		font-size: 2.5rem;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin-bottom: 3rem;
		font-size: 1.1rem;
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

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1.25rem 2rem;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.create-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.create-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.poll-created {
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: #f0fdf4;
		border: 2px solid #16a34a;
		border-radius: 12px;
		text-align: center;
	}

	.poll-created h3 {
		color: #16a34a;
		margin-bottom: 1rem;
	}

	.room-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.room-info p {
		margin: 0;
		font-size: 1.1rem;
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
</style>
