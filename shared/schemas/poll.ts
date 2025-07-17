import { z } from 'zod';
import { PollPlayerSchema } from './player';

/**
 * Poll Schema System
 * 
 * Defines schemas for polling functionality with UUID-based player tracking.
 * Each poll tracks individual votes by player UUID rather than just vote counts.
 */

/**
 * Poll Schema
 * Represents a poll with individual vote tracking by player UUID
 */
export const PollSchema = z.object({
	/** Unique UUID identifier for the poll */
	id: z.string().uuid(),
	/** Poll question/title */
	title: z.string().min(1).max(200),
	/** Available voting options (minimum 2 required) */
	options: z.array(z.string().min(1)).min(2).max(10),
	/** Vote tracking: option name -> array of player UUIDs who voted for it */
	votes: z.record(z.string(), z.array(z.string().uuid())),
	/** Players who have joined this poll */
	players: z.array(PollPlayerSchema)
});

/**
 * Legacy Poll Schema
 * For backward compatibility with old poll format (vote counts only)
 * TODO: Remove after migration is complete
 */
export const LegacyPollSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	options: z.array(z.string()).min(2),
	votes: z.record(z.string(), z.number())
});

// Export TypeScript types inferred from schemas
export type Poll = z.infer<typeof PollSchema>;
export type LegacyPoll = z.infer<typeof LegacyPollSchema>;

// Re-export player types for convenience
export type { PollPlayer } from './player';
