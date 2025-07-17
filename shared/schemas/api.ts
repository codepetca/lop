import { z } from 'zod';
import { PollSchema } from './poll';

// Create poll request schema
export const CreatePollRequestSchema = z.object({
	title: z.string().optional(),
	options: z.array(z.string()).min(2).optional()
});

// Create poll response schema
export const CreatePollResponseSchema = z.object({
	success: z.boolean(),
	poll: PollSchema.optional(),
	error: z.string().optional()
});

// Get poll response schema
export const GetPollResponseSchema = z.object({
	poll: PollSchema.nullable()
});

// Room registration request schema
export const RegisterRoomRequestSchema = z.object({
	id: z.string(),
	title: z.string()
});

// Room registration response schema
export const RegisterRoomResponseSchema = z.object({
	success: z.boolean(),
	error: z.string().optional()
});

// Generic API error response schema
export const ApiErrorResponseSchema = z.object({
	error: z.string(),
	message: z.string().optional()
});

// Export TypeScript types inferred from schemas
export type CreatePollRequest = z.infer<typeof CreatePollRequestSchema>;
export type CreatePollResponse = z.infer<typeof CreatePollResponseSchema>;
export type GetPollResponse = z.infer<typeof GetPollResponseSchema>;
export type RegisterRoomRequest = z.infer<typeof RegisterRoomRequestSchema>;
export type RegisterRoomResponse = z.infer<typeof RegisterRoomResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
