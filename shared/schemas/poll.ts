import { z } from 'zod';

// Poll schema
export const PollSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	options: z.array(z.string()).min(2),
	votes: z.record(z.string(), z.number())
});

// Export TypeScript type inferred from schema
export type Poll = z.infer<typeof PollSchema>;
