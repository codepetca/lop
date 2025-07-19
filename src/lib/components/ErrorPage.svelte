<script lang="ts">
	import { browser } from '$app/environment';

	function refreshPage() {
		if (browser) {
			window.location.reload();
		}
	}

	function goToLobby() {
		if (browser) {
			window.location.href = '/';
		}
	}
</script>

<main class="error-container">
	<div class="error-card">
		<h1 class="error-title">Oops!</h1>

		<div class="error-actions">
			<button class="btn btn-primary" onclick={refreshPage}>Refresh</button>
			<button class="btn btn-secondary" onclick={goToLobby}>Back to Lobby</button>
		</div>
	</div>
</main>

<style>
	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.error-card {
		text-align: center;
	}

	.error-title {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: #374151;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.875rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 1rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-secondary {
		background: #6b7280;
		color: white;
	}

	.btn-secondary:hover {
		background: #4b5563;
	}

	@media (max-width: 640px) {
		.error-container {
			padding: 1rem;
		}

		.error-title {
			font-size: 2rem;
		}

		.error-actions {
			flex-direction: column;
		}
	}
</style>
