import { z } from 'zod';

// Player schema for polls
export const PollPlayerSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	joinedAt: z.string()
});

// Poll schema with individual vote tracking
export const PollSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1),
	options: z.array(z.string()).min(2),
	votes: z.record(z.string(), z.array(z.string().uuid())), // option -> array of player UUIDs
	players: z.array(PollPlayerSchema)
});

// Legacy poll schema for backward compatibility
export const LegacyPollSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	options: z.array(z.string()).min(2),
	votes: z.record(z.string(), z.number())
});

// Export TypeScript types inferred from schemas
export type Poll = z.infer<typeof PollSchema>;
export type PollPlayer = z.infer<typeof PollPlayerSchema>;
export type LegacyPoll = z.infer<typeof LegacyPollSchema>;
