import type * as Party from 'partykit/server';
import {
	Poll,
	PollUpdateMessage,
	MessageSchema,
	GetPollResponseSchema,
	CreatePollResponseSchema
} from '../shared/schemas/index.js';
import {
	handleVote,
	handleCreatePollServerGenerated,
	handleCreatePollServerGeneratedNoRegistration,
	handleGetPoll
} from './handlers';

export default class PollServer implements Party.Server {
	constructor(readonly room: Party.Room) {}

	// Store poll data in memory
	poll: Poll | null = null;

	// Load poll data from storage when the room starts
	async onStart() {
		const storedPoll = await this.room.storage.get<Poll>('poll');
		if (storedPoll) {
			this.poll = storedPoll;
		}
	}

	// Handle new WebSocket connections
	async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		// Send current poll data to new connections
		if (this.poll) {
			conn.send(
				JSON.stringify({
					type: 'poll-update',
					poll: this.poll
				} as PollUpdateMessage)
			);
		}
	}

	// Handle incoming WebSocket messages
	async onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message);
			const validatedMessage = MessageSchema.parse(data);

			if (validatedMessage.type === 'vote' && this.poll) {
				const updatedPoll = await handleVote(this.room, this.poll, validatedMessage);
				if (updatedPoll) {
					this.poll = updatedPoll;
				}
			}
		} catch (error) {
			console.error('Error processing message:', error);
		}
	}

	// Handle HTTP requests (for creating polls)
	async onRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST') {
			try {
				// Create server-generated poll (without registration since lobby handles it)
				const poll = await handleCreatePollServerGeneratedNoRegistration(this.room);
				this.poll = poll;

				console.log('Created poll:', JSON.stringify(poll, null, 2));

				const response = CreatePollResponseSchema.parse({
					success: true,
					poll: poll
				});
				
				console.log('Response after validation:', JSON.stringify(response, null, 2));
				
				return new Response(JSON.stringify(response), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.error('Error creating poll:', error);
				if (error instanceof Error) {
					console.error('Error details:', error.message);
				}
				const errorResponse = CreatePollResponseSchema.parse({
					success: false,
					error: 'poll_creation_failed'
				});
				return new Response(JSON.stringify(errorResponse), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		if (req.method === 'GET') {
			const response = GetPollResponseSchema.parse({
				poll: this.poll
			});
			return new Response(JSON.stringify(response), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response('Method not allowed', { status: 405 });
	}
}

PollServer satisfies Party.Worker;
