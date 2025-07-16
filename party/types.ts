import { z } from 'zod';

// Poll schema
export const PollSchema = z.object({
	id: z.string(),
	title: z.string(),
	options: z.array(z.string()).min(2),
	votes: z.record(z.string(), z.number())
});

// Vote message schema
export const VoteMessageSchema = z.object({
	type: z.literal('vote'),
	option: z.string()
});

// Poll update message schema
export const PollUpdateMessageSchema = z.object({
	type: z.literal('poll-update'),
	poll: PollSchema
});

// Room metadata schema for lobby
export const RoomMetadataSchema = z.object({
	id: z.string(),
	title: z.string(),
	createdAt: z.string(),
	activeConnections: z.number().default(0),
	totalVotes: z.number().default(0)
});

// Room list request message schema
export const RoomListRequestMessageSchema = z.object({
	type: z.literal('room-list-request')
});

// Room list message schema
export const RoomListMessageSchema = z.object({
	type: z.literal('room-list'),
	rooms: z.array(RoomMetadataSchema)
});

// Union of all WebSocket message types
export const MessageSchema = z.discriminatedUnion('type', [
	VoteMessageSchema,
	PollUpdateMessageSchema,
	RoomListRequestMessageSchema,
	RoomListMessageSchema
]);

// Export TypeScript types inferred from schemas
export type Poll = z.infer<typeof PollSchema>;
export type VoteMessage = z.infer<typeof VoteMessageSchema>;
export type PollUpdateMessage = z.infer<typeof PollUpdateMessageSchema>;
export type RoomMetadata = z.infer<typeof RoomMetadataSchema>;
export type RoomListRequestMessage = z.infer<typeof RoomListRequestMessageSchema>;
export type RoomListMessage = z.infer<typeof RoomListMessageSchema>;
export type Message = z.infer<typeof MessageSchema>;
