/**
 * Generate a random poll ID
 * Returns a 9-character alphanumeric string
 */
export function generatePollId(): string {
	return Math.random().toString(36).substring(2, 11);
}

/**
 * Initialize vote counts for poll options
 */
export function initializePollVotes(options: string[]): Record<string, number> {
	const votes: Record<string, number> = {};
	options.forEach((option) => {
		votes[option] = 0;
	});
	return votes;
}
