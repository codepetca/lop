<script lang="ts">
	import type { StoryChoice } from '$lib/types';
	import BackgroundScene from './BackgroundScene.svelte';
	import ImageTarget from './ImageTarget.svelte';
	import VotingFallback from './VotingFallback.svelte';

	let {
		scene,
		votingOptions,
		votes,
		hasVoted,
		vote,
		totalVotes,
		votingTimeLeft,
		wsStatus
	}: {
		scene: { backgroundImage?: string; interactionMode?: 'cards' | 'image-targets' };
		votingOptions: StoryChoice[];
		votes: Record<string, number>;
		hasVoted: boolean;
		vote: (choiceId: string) => void;
		totalVotes: number;
		votingTimeLeft: number;
		wsStatus: string;
	} = $props();

	// Determine if we should show interactive scene or fallback
	const showInteractiveScene = $derived(
		scene.interactionMode === 'image-targets' &&
			scene.backgroundImage &&
			votingOptions.some((choice) => choice.position || choice.imageUrl)
	);
</script>

{#if showInteractiveScene}
	<!-- Interactive image-based voting -->
	<div class="interactive-scene-container">
		<h3>What happens next?</h3>
		<p class="scene-instruction">Click on the interactive elements in the scene below:</p>

		<BackgroundScene src={scene.backgroundImage}>
			{#each votingOptions as choice (choice.id)}
				<ImageTarget
					{choice}
					votes={votes[choice.id] || 0}
					{hasVoted}
					disabled={hasVoted ||
						wsStatus !== 'connected' ||
						(votingTimeLeft <= 0 && votingTimeLeft !== 0)}
					onclick={() => vote(choice.id)}
				/>
			{/each}
		</BackgroundScene>

		<!-- Show choice effects below the interactive scene -->
		{#if votingOptions.some((choice) => choice.effects && Object.keys(choice.effects).length > 0)}
			<div class="choice-effects-panel">
				<h4>Choice Effects:</h4>
				<div class="effects-grid">
					{#each votingOptions as choice}
						{#if choice.effects && Object.keys(choice.effects).length > 0}
							<div class="effect-group">
								<span class="effect-label">{choice.text}:</span>
								<div class="effects">
									{#each Object.entries(choice.effects) as [stat, change]}
										<span class="effect">{stat}: {change > 0 ? '+' : ''}{change}</span>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Fallback to traditional card-based voting -->
	<VotingFallback
		{votingOptions}
		{votes}
		{hasVoted}
		{vote}
		{totalVotes}
		{votingTimeLeft}
		{wsStatus}
	/>
{/if}

<style>
	.interactive-scene-container {
		margin-bottom: 2rem;
	}

	.interactive-scene-container h3 {
		color: #1f2937;
		margin-bottom: 1rem;
		font-size: 1.3rem;
	}

	.scene-instruction {
		color: #6b7280;
		margin-bottom: 1.5rem;
		font-style: italic;
		text-align: center;
	}

	.choice-effects-panel {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.choice-effects-panel h4 {
		color: #374151;
		margin-bottom: 0.75rem;
		font-size: 1rem;
	}

	.effects-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.effect-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.effect-label {
		font-weight: 600;
		color: #4b5563;
		min-width: 120px;
		font-size: 0.9rem;
	}

	.effects {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.effect {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	@media (max-width: 640px) {
		.effect-group {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.effect-label {
			min-width: auto;
		}
	}
</style>