<script lang="ts">
	import type { StoryChoice } from '$lib/types';

	let {
		votingOptions,
		votes,
		hasVoted,
		vote,
		totalVotes,
		votingTimeLeft,
		wsStatus
	}: {
		votingOptions: StoryChoice[];
		votes: Record<string, number>;
		hasVoted: boolean;
		vote: (choiceId: string) => void;
		totalVotes: number;
		votingTimeLeft: number;
		wsStatus: string;
	} = $props();

	// Calculate voting stats for each choice
	const choiceStats = $derived(
		votingOptions.map((choice: StoryChoice) => ({
			choice,
			votes: votes[choice.id] || 0,
			percentage: totalVotes > 0 ? ((votes[choice.id] || 0) / totalVotes) * 100 : 0
		}))
	);
</script>

<div class="story-choices">
	<h3>What happens next?</h3>
	<div class="choices">
		{#each choiceStats as { choice, votes: choiceVotes, percentage }}
			<div class="choice">
				<button
					class="choice-btn"
					class:voted={hasVoted}
					onclick={() => vote(choice.id)}
					disabled={hasVoted ||
						wsStatus !== 'connected' ||
						(votingTimeLeft <= 0 && votingTimeLeft !== 0)}
				>
					<div class="choice-content">
						<span class="choice-text">{choice.text}</span>
						<span class="choice-votes">{choiceVotes}</span>
					</div>

					{#if choice.effects && Object.keys(choice.effects).length > 0}
						<div class="choice-effects">
							{#each Object.entries(choice.effects) as [stat, change]}
								<span class="effect">{stat}: {change > 0 ? '+' : ''}{change}</span>
							{/each}
						</div>
					{/if}

					{#if totalVotes > 0}
						<div class="progress-bar">
							<div class="progress-fill" style="width: {percentage}%"></div>
						</div>
						<span class="percentage">{percentage.toFixed(1)}%</span>
					{/if}
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Story Choices */
	.story-choices h3 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 1.3rem;
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.choice {
		position: relative;
	}

	.choice-btn {
		width: 100%;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
		text-align: left;
	}

	.choice-btn:hover:not(:disabled) {
		border-color: #6366f1;
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
	}

	.choice-btn:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.choice-btn.voted {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.choice-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		position: relative;
		z-index: 2;
		margin-bottom: 0.5rem;
	}

	.choice-text {
		font-size: 1rem;
		color: #374151;
		line-height: 1.4;
		flex: 1;
		margin-right: 1rem;
	}

	.choice-votes {
		font-weight: 600;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.choice-effects {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
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

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: #e5e7eb;
		border-radius: 0 0 10px 10px;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #6366f1, #8b5cf6);
		border-radius: 0 0 10px 10px;
		transition: width 0.5s ease;
	}

	.percentage {
		position: absolute;
		top: 0.5rem;
		right: 1.5rem;
		font-size: 0.8rem;
		color: #6b7280;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.choice-btn {
			padding: 1rem;
		}

		.percentage {
			position: static;
			margin-top: 0.5rem;
			display: block;
		}
	}
</style>