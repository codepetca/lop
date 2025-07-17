import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random poll ID
 * Returns a UUID v4 string
 */
export function generatePollId(): string {
	return uuidv4();
}

/**
 * Generate a random player ID
 * Returns a UUID v4 string
 */
export function generatePlayerId(): string {
	return uuidv4();
}

/**
 * Initialize vote tracking for poll options (UUID-based)
 */
export function initializePollVotes(options: string[]): Record<string, string[]> {
	const votes: Record<string, string[]> = {};
	options.forEach((option) => {
		votes[option] = [];
	});
	return votes;
}

/**
 * Initialize legacy vote counts for poll options (backward compatibility)
 */
export function initializeLegacyPollVotes(options: string[]): Record<string, number> {
	const votes: Record<string, number> = {};
	options.forEach((option) => {
		votes[option] = 0;
	});
	return votes;
}
